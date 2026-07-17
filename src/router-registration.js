import { createRoutingConfig } from './config';
import { createRoutesLUT, handleRouteChange } from './router-handler';
export function bindRouterToRoutableRuntime(router, runtime, options = {}) {
    Object.assign(runtime.config, createRoutingConfig(options));
    createRoutesLUT(router, runtime);
    router.beforeEach((to, from) => handleRouteChange(to, from, runtime));
    return router;
}
