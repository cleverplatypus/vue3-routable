import {
  Router,
  RouteLocation,
  RouteLocationNormalized,
  RouteRecordNormalized,
  RouteRecordRaw,
} from 'vue-router';
import {
  getRegisteredClass,
  registeredClasses,
  registerRoutableObject,
  routeableObjects,
} from './registry';
import { GuardConfig, RoutableConfig } from './types';

function setRoutesMetadata(
  root: Array<RouteRecordNormalized>,
  routes: Array<RouteRecordNormalized>,
  parentPath = ''
) {
  routes.forEach((node) => {
    const pathName = parentPath
      ? `${parentPath}.${String(node.name)}`
      : node.name;
    node.meta = node.meta || {};
    node.meta.pathName = pathName;
    const rootNode = root.find((r) => r.name === node.name);
    rootNode.meta = rootNode.meta || {};
    rootNode.meta.pathName = pathName;

    if (node.children?.length) {
      setRoutesMetadata(
        root,
        node.children as Array<RouteRecordNormalized>,
        pathName
      );
    }
  });
}

function matchesRoute(config: RoutableConfig, route: RouteLocation) {
  if (Array.isArray(config.activeRoutes)) {
    return !!config.activeRoutes.find((exp) => {
      if (exp instanceof RegExp) {
        return exp.test(route.meta?.pathName as string);
      } else if (typeof exp === 'string') {
        return exp === route.meta?.pathName;
      } else {
        return exp(route);
      }
    });
  }
}

function handleError(promise: any, object: any, method: string) {
  if (!(promise instanceof Promise)) {
    throw new Error(
      `Controller ${object}.${method} must be async or return a Promise`
    );
  }
  return promise.catch((error) => {
    console.error(`Error in ${method} for target ${object}: ${error.message}`);
  });
}

async function handleRouteChange(to: RouteLocation, from: RouteLocation) {
  const promises: Array<() => Promise<any>> = [];
  const guards: Array<{
    guard: GuardConfig;
    to: RouteLocation;
    from: RouteLocation;
  }> = [];

  Array.from(routeableObjects).forEach((routable) => {
    const key = Object.getPrototypeOf(Object.getPrototypeOf(routable));
    const config = getRegisteredClass(key);
    if (!config) {
      return;
    }
    const matchesTo = matchesRoute(config!, to);
    const matchesFrom = matchesRoute(config!, from);
    if (!matchesTo && !matchesFrom) {
      return;
    }
    if (to.name === from.name) {
      if (config.update)
        promises.push(() =>
          handleError(
            config.update.call(routable, to, from),
            key.constructor.name,
            'update'
          )
        );
    } else {
      if (config.guardEnter && matchesTo) {
        guards.push({ guard: config.guardEnter, to, from });
      }
      if (config.guardLeave && matchesFrom) {
        guards.push({ guard: config.guardLeave, to, from });
      }
      if (config.activate && matchesTo) {
        promises.push(() =>
          handleError(
            config.activate.call(routable, to, from),
            key.constructor.name,
            'activate'
          )
        );
      } else if (config.deactivate) {
        promises.push(() =>
          handleError(
            config.deactivate.call(routable, to, from),
            key.constructor.name,
            'deactivate'
          )
        );
      }
    }
  });
  guards.sort(
    ({ guard: a }, { guard: b }) => Number(b.priority) - Number(a.priority)
  );
  let guardOutcome: boolean | RouteRecordRaw;
  for (const config of guards) {
    guardOutcome = await config.guard.handler(to, from);
    if (guardOutcome !== true) {
      return guardOutcome;
    }
  }
  await Promise.all(promises.map((p) => p()));
}

export function registerRouter(router: Router): Router {
  const routes = router.getRoutes();
  setRoutesMetadata(routes, routes);
  router.beforeEach(handleRouteChange);
  return router;
}

export function registerRoutableClasses(...classes: Array<any>) {
  for (const clazz of classes) clazz.prototype; //just poke the class in order to be loaded
}

export * from './decorators';
