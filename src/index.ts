import type { Router } from 'vue-router';
import routingConfig from './config';
import { createRoutesLUT, handleRouteChange } from './router-handler';
import type { RoutingConfig } from './types';

/**
 * Registers the router with the library.
 * Necessary to create the route bindings.
 *
 * @category Functions
 * @param router
 * @param options
 * @returns the router object
 */
export function registerRouter(
  router: Router,
  options: RoutingConfig = { defaultMatchTarget: 'name', routeNameChainSeparator: '.'}
): Router {
  const routes = router.getRoutes();
  Object.assign(routingConfig, options);
  createRoutesLUT(router);

  router.beforeEach(handleRouteChange);
  return router;
}

/**
 * Just pokes the passed routable class so that it's included in the bundle
 * and the decorators are evaluated.
 *
 * @category Functions
 * @param {...Array<any>} classes - An array of classes to register.
 */
export function registerRoutableClasses(...classes: Array<any>) {
  for (const clazz of classes) clazz.prototype; //just poke the class in order to be loaded
}

export {
  routableObjectIsActive,
  routeMatches,
  routeChainMatches,
} from './router-handler';

export * from './decorators';

export {enableRoutableDevtools, devToolsEventEmitter} from './devtools/devtools-plugin';