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
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL or SUPABASE_DATABASE_POOLER_URL must be configured in production environment.')
  }
  uniqueConnections.push('postgres://postgres:postgres@127.0.0.1:5432/postgres')
}

const databaseHost = new URL(uniqueConnections[0]).hostname
if (process.env.NODE_ENV === 'production' && ['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
  throw new Error(
    'DATABASE_URL points to a local database in production. Configure the Supabase Postgres connection string before starting the application.'
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
    if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
      return { rejectUnauthorized: false }
    }
    return 'require'
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
      max: Number(process.env.DATABASE_POOL_SIZE || 20),
      idle_timeout: 30,
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
    const node = getNextHealthyNode()
    try {
      const result: any = Reflect.apply(node.client, node.client, argumentsList)
      if (result && typeof result.then === 'function') {
        if (dbNodes.length <= 1) return result
        return Promise.resolve(result).catch((error: any) => {
          node.healthy = false
          node.lastChecked = Date.now()
          const nextNode = getNextHealthyNode()
          if (nextNode.id === node.id) throw error
          return Reflect.apply(nextNode.client, nextNode.client, argumentsList)
        })
      }
      return result
    } catch (error: any) {
      node.healthy = false
      node.lastChecked = Date.now()
      if (dbNodes.length <= 1) throw error
      const nextNode = getNextHealthyNode()
      if (nextNode.id === node.id) throw error
      return Reflect.apply(nextNode.client, nextNode.client, argumentsList)
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
        const currentNode = getNextHealthyNode()
        const method = Reflect.get(currentNode.client, prop)
        try {
          const res: any = Reflect.apply(method, currentNode.client, args)
          if (res && typeof res.then === 'function') {
            if (dbNodes.length <= 1) return res
            return Promise.resolve(res).catch((error: any) => {
              currentNode.healthy = false
              currentNode.lastChecked = Date.now()
              const nextNode = getNextHealthyNode()
              if (nextNode.id === currentNode.id) throw error
              const nextMethod = Reflect.get(nextNode.client, prop)
              return Reflect.apply(nextMethod, nextNode.client, args)
            })
          }
          return res
        } catch (error: any) {
          currentNode.healthy = false
          currentNode.lastChecked = Date.now()
          if (dbNodes.length <= 1) throw error
          const nextNode = getNextHealthyNode()
          if (nextNode.id === currentNode.id) throw error
          const nextMethod = Reflect.get(nextNode.client, prop)
          return Reflect.apply(nextMethod, nextNode.client, args)
        }
      }
    }

    return value
  }
})

export const db = drizzle(loadBalancedClient as any, { schema })
