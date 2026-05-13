import type { Router } from 'vue-router';
import { createRoutingConfig } from './config';
import { createRoutesLUT, handleRouteChange } from './router-handler';
import type { RoutableRuntime, RoutingConfig } from './types';

export function bindRouterToRoutableRuntime(
  router: Router,
  runtime: RoutableRuntime,
  options: Partial<RoutingConfig> = {}
): Router {
  Object.assign(runtime.config, createRoutingConfig(options));
  createRoutesLUT(router, runtime);
  router.beforeEach((to, from) => handleRouteChange(to, from, runtime));

  return router;
}