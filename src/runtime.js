import { createRoutingConfig } from './config';
import { routeableObjects } from './registry';
export function createRoutableRuntime(options = {}, routableRegistry = new Set()) {
    return {
        config: createRoutingConfig(options),
        routesLUT: new Map(),
        routableObjects: routableRegistry,
    };
}
export const defaultRoutableRuntime = createRoutableRuntime({}, routeableObjects);
