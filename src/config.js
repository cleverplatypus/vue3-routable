export const DEFAULT_ROUTING_CONFIG = {
    defaultMatchTarget: 'name',
    routeNameChainSeparator: '.',
};
export function createRoutingConfig(config = {}) {
    return {
        ...DEFAULT_ROUTING_CONFIG,
        ...config,
    };
}
export default createRoutingConfig();
