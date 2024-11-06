import type {
  Router
} from 'vue-router';
import routingConfig from './config.ts';
import { handleRouteChange } from './router-handler.ts';
import type { RoutingConfig } from './types.ts';


export function registerRouter(router: Router, options : RoutingConfig = { defaultMatchTarget : 'name'}): Router {
  const routes = router.getRoutes();
  Object.assign(routingConfig, options);

  router.beforeEach(handleRouteChange);
  return router;
}

export function registerRoutableClasses(...classes: Array<any>) {
  for (const clazz of classes) clazz.prototype; //just poke the class in order to be loaded
}

export * from './decorators.ts';
