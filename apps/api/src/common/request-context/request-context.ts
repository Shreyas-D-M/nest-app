import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context propagated without threading arguments through every
 * function signature.
 *
 * Only correlation data belongs here. Authenticated identity will NOT be stored
 * in this store when auth arrives: implicit ambient identity makes authorisation
 * bugs easy to write and hard to see. Permissions must be passed explicitly.
 */
export interface RequestContext {
  requestId: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Returns the current request id, or `undefined` outside a request (for example
 * during startup or in a background job).
 */
export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId;
}
