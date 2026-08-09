import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { setDefaultResultOrder } from 'node:dns'
import * as schema from './schema'

setDefaultResultOrder('ipv4first')

// Load balanced nodes: list of connection strings
const connectionStrings: string[] = []

if (process.env.SUPABASE_DATABASE_POOLER_URL) {
  connectionStrings.push(process.env.SUPABASE_DATABASE_POOLER_URL)
}
if (process.env.DATABASE_URL) {
  connectionStrings.push(process.env.DATABASE_URL)
}

// Ensure unique connection string candidates
const uniqueConnections = Array.from(new Set(connectionStrings)).filter(Boolean)

if (uniqueConnections.length === 0) {
  throw new Error('No database connection strings configured.')
}

const databaseHost = new URL(uniqueConnections[0]).hostname
if (['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
  throw new Error(
    'DATABASE_URL points to a local database. Configure the Supabase Postgres connection string before starting the application.'
  )
}

if (process.env.NODE_ENV === 'production' && /^db\.[a-z0-9-]+\.supabase\.co$/i.test(databaseHost)) {
  console.warn(
    'DATABASE_URL points to the direct Supabase database host. Set SUPABASE_DATABASE_POOLER_URL to the Supabase Session pooler URI for IPv4-compatible load-balanced app traffic.'
  )
}

// Helper to determine SSL option
function getSslOption(connStr: string) {
  if (connStr.includes('supabase') || connStr.includes('neon') || connStr.includes('aws')) {
    return { rejectUnauthorized: false }
  }
  return false
}

// Create connection clients for each connection string node
const dbNodes = uniqueConnections.map((connStr, index) => {
  const host = new URL(connStr).hostname
  return {
    id: `node-${index + 1}`,
    host,
    connectionString: connStr,
    client: postgres(connStr, {
      ssl: getSslOption(connStr),
      max: Number(process.env.DATABASE_POOL_SIZE || 5),
      idle_timeout: 20,
      connect_timeout: 15,
    }),
    healthy: true,
    lastChecked: Date.now(),
  }
})

let currentNodeIndex = 0

// High Availability round-robin / failover strategy
function getNextHealthyNode() {
  const totalNodes = dbNodes.length
  for (let i = 0; i < totalNodes; i++) {
    const index = (currentNodeIndex + i) % totalNodes
    const node = dbNodes[index]
    if (node.healthy || Date.now() - node.lastChecked > 30_000) { // Retry unhealthy nodes after 30 seconds
      node.healthy = true // reset health status
      currentNodeIndex = (index + 1) % totalNodes // advance round-robin pointer
      return node
    }
  }
  // If all nodes are marked unhealthy, fall back to the first node
  return dbNodes[0]
}

// Proxy wrapper around the database client to intercept and load-balance/fail-over queries
const loadBalancedClient = new Proxy(() => {}, {
  // Intercept calling the client directly: client`select *` or client(...)
  apply(target, thisArg, argumentsList) {
    let attempts = 0
    const maxAttempts = dbNodes.length

    while (attempts < maxAttempts) {
      const node = getNextHealthyNode()
      try {
        // Execute the query on the chosen node
        return Reflect.apply(node.client, node.client, argumentsList)
      } catch (error: any) {
        attempts++
        console.warn(`[LoadBalancer] Query failed on database ${node.id} (${node.host}):`, error.message || error)
        node.healthy = false
        node.lastChecked = Date.now()
        if (attempts >= maxAttempts) {
          throw error // No more healthy nodes left
        }
        console.log(`[LoadBalancer] Retrying query on next available node...`)
      }
    }
  },

  // Intercept accessing properties/methods (like .begin, .end, .listen, etc.)
  get(target, prop, receiver) {
    if (prop === 'end') {
      return async function () {
        console.log('[LoadBalancer] Closing all client connection pools...')
        await Promise.all(dbNodes.map(node => node.client.end()))
      }
    }

    // Default to routing the property access to the current healthy node client
    const node = getNextHealthyNode()
    const value = Reflect.get(node.client, prop)

    if (typeof value === 'function') {
      return function (...args: any[]) {
        let attempts = 0
        const maxAttempts = dbNodes.length

        while (attempts < maxAttempts) {
          const currentNode = getNextHealthyNode()
          const method = Reflect.get(currentNode.client, prop)
          try {
            return Reflect.apply(method, currentNode.client, args)
          } catch (error: any) {
            attempts++
            console.warn(`[LoadBalancer] Method .${String(prop)} failed on ${currentNode.id} (${currentNode.host}):`, error.message || error)
            currentNode.healthy = false
            currentNode.lastChecked = Date.now()
            if (attempts >= maxAttempts) {
              throw error
            }
            console.log(`[LoadBalancer] Retrying method .${String(prop)} on next available node...`)
          }
        }
      }
    }

    return value
  }
})

export const db = drizzle(loadBalancedClient as any, { schema })
