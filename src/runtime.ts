import { createRoutingConfig } from './config';
import { routeableObjects } from './registry';
import type { RoutableRuntime, RoutingConfig } from './types';

export function createRoutableRuntime<TScope = unknown>(
  options: Partial<RoutingConfig> = {},
  routableRegistry: Set<object> = new Set()
): RoutableRuntime<TScope> {
  return {
    config: createRoutingConfig(options),
    routesLUT: new Map(),
    routableObjects: routableRegistry,
  };
}

export const defaultRoutableRuntime = createRoutableRuntime(
  {},
  routeableObjects
);