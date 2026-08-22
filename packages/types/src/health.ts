/** Health and readiness contracts for the API shell. */

export type DependencyStatus = 'up' | 'down' | 'disabled';

/**
 * Liveness. Answers "is the process running?" and must not depend on any
 * external system, so that a database blip cannot cause a restart loop.
 */
export interface LivenessResponse {
  status: 'ok';
  service: string;
  version: string;
  uptimeSeconds: number;
}

/**
 * Readiness. Answers "can this instance serve traffic?" and therefore does
 * probe dependencies.
 */
export interface ReadinessResponse {
  status: 'ok' | 'degraded';
  dependencies: Record<string, DependencyCheck>;
}

export interface DependencyCheck {
  status: DependencyStatus;
  /** Human-readable detail. Must never contain credentials or connection strings. */
  detail?: string;
  latencyMs?: number;
}
