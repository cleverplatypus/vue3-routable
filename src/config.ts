import type { RoutingConfig } from './types';

export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  defaultMatchTarget: 'name',
  routeNameChainSeparator: '.',
};

export function createRoutingConfig(
  config: Partial<RoutingConfig> = {}
): RoutingConfig {
  return {
    ...DEFAULT_ROUTING_CONFIG,
    ...config,
  };
}

export default createRoutingConfig();
