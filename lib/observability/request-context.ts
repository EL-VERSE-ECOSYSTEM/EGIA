import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContextStore {
  requestId: string;
  traceId: string;
  userId?: string;
  schoolId?: string;
  role?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>()

export function getRequestContext(): RequestContextStore | undefined {
  return requestContext.getStore()
}
