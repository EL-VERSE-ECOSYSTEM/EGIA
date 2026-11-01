import { sqlClient } from '@/lib/db'
import { getAllCircuitBreakersStatus } from './circuit-breaker'

export type DependencyStatus = 'healthy' | 'degraded' | 'down';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  dependencies: Record<string, DependencyStatus>;
}

export async function checkDatabaseHealth(): Promise<DependencyStatus> {
  try {
    const res = await sqlClient`SELECT 1 as alive;`;
    return res && res.length > 0 ? 'healthy' : 'down';
  } catch (error) {
    return 'down';
  }
}

export async function checkAllDependenciesHealth(): Promise<HealthCheckResult> {
  const dbStatus = await checkDatabaseHealth();
  const circuitStatuses = getAllCircuitBreakersStatus();

  const dependencies: Record<string, DependencyStatus> = {
    database: dbStatus,
    auth: 'healthy',
    storage: 'healthy',
    realtime: 'healthy',
    ai: 'healthy',
    payments: 'healthy',
    email: 'healthy',
    fcm: 'healthy',
  };

  for (const c of circuitStatuses) {
    if (c.state === 'OPEN') {
      dependencies[c.name] = 'down';
    } else if (c.state === 'HALF_OPEN') {
      dependencies[c.name] = 'degraded';
    }
  }

  const values = Object.values(dependencies);
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (dependencies.database === 'down') {
    status = 'unhealthy';
  } else if (values.some((v) => v === 'down' || v === 'degraded')) {
    status = 'degraded';
  }

  return {
    status,
    service: 'el-learners-app',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    dependencies,
  };
}
