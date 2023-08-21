import type {
  Router
} from 'vue-router';
import { handleRouteChange, setRoutesMetaPathName } from './router-handler.ts';

export function registerRouter(router: Router): Router {
  const routes = router.getRoutes();
  setRoutesMetaPathName(routes, routes);
  router.beforeEach(handleRouteChange);
  return router;
}

export function registerRoutableClasses(...classes: Array<any>) {
  for (const clazz of classes) clazz.prototype; //just poke the class in order to be loaded
}

export * from './decorators.ts';
