
import type {
  RouteLocation,
  RouteRecordNormalized,
  RouteRecordRaw,
  Router,
} from 'vue-router';
import { getMetadata, getRegisteredClass, routeableObjects } from './registry.ts';
import type {
  GuardConfig,
  HandlerParamMetadata,
  RoutableConfig,
  RouteChangeHandlerConfig,
} from './types.ts';
import {
  FROM_METADATA,
  HANDLER_ARGS_METADATA,
  META_METADATA,
  PARAM_METADATA,
  QUERY_METADATA,
  TO_METADATA,
} from './symbols.js';
import get from 'lodash.get';

function checkRouteHandlerReturnValue(val: any, clazz: string) {
  const throwError = () => {
    throw new Error(`Router handler in ${clazz} function's return value must be 
    Promise<undefined|boolean|RouteLocationNamedRaw|RouteLocationPathRaw>. Was \`${val}\` instead`);
  };
  if (val === undefined) {
    return true;
  }
  if (val === null) {
    throwError();
  }

  if (typeof val === 'boolean') {
    return val;
  }

  if (
    typeof val === 'object' &&
    (val.hasOwnProperty('name') || val.hasOwnProperty('path'))
  ) {
    return val;
  }

  throwError();
}

function setRoutesMetadata(
  root: Array<RouteRecordNormalized>,
  routes: Array<RouteRecordNormalized>,
  parentPath = ''
) {
  routes.forEach((node) => {
    const pathName = parentPath
      ? `${parentPath}.${String(node.name!.toString())}`
      : node.name!.toString();
    node.meta = node.meta || {};
    node.meta.pathName = pathName;
    const rootNode = root.find((r) => r.name === node.name)!;
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

function getHandlerParams(
  config: RouteChangeHandlerConfig,
  target : Object,
  to: RouteLocation,
  from: RouteLocation
): Array<any> {
  return (
    getMetadata(HANDLER_ARGS_METADATA, Object.getPrototypeOf(target), config.handler) ||
    []
  ).map((param: HandlerParamMetadata) => {
    switch (param.type) {
      case PARAM_METADATA:
        return param.args.length ? to.params[param.args[0]] : to.params;
      case QUERY_METADATA:
        return param.args.length ? to.query[param.args[0]] : to.query;
      case META_METADATA:
        return param.args.length ? get(to.meta, param.args[0]) : to.meta;
      case TO_METADATA:
        return param.args.length ? get(to, param.args[0]) : to;
      case FROM_METADATA:
        return param.args.length ? get(from, param.args[0]) : from;
    }
  });

}

async function handleRouteChange(to: RouteLocation, from: RouteLocation) {
  const guards: Array<{ config: GuardConfig; class: string; target: any }> = [];
  const handlers: Array<{
    config: RouteChangeHandlerConfig;
    class: string;
    target: any;
  }> = [];

  Array.from(routeableObjects).forEach((routable) => {
    const key = Object.getPrototypeOf(routable);
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
        handlers.push({
          config: config.update,
          class: config.class!,
          target: routable,
        });
    } else {
      if (config.guardEnter && matchesTo) {
        guards.push({
          config: config.guardEnter,
          class: config.class!,
          target: routable,
        });
      }
      if (config.guardLeave && matchesFrom) {
        guards.push({
          config: config.guardLeave,
          class: config.class!,
          target: routable,
        });
      }
      if (config.activate && matchesTo) {
        handlers.push({
          config: config.activate,
          class: config.class!,
          target: routable,
        });
      } else if (config.deactivate) {
        handlers.push({
          config: config.deactivate,
          class: config.class!,
          target: routable,
        });
      }
    }
  });
  guards.sort((a, b) => Number(b.config.priority) - Number(a.config.priority));
  handlers.sort(
    (a, b) => Number(b.config.priority) - Number(a.config.priority)
  );
  let outcome: boolean | RouteRecordRaw = true;

  for (const guard of guards) {
    outcome = checkRouteHandlerReturnValue(
      await guard.target[guard.config.handler](...getHandlerParams(guard.config, guard.target, to, from)),
      guard.class
    );
    if (outcome !== true) {
      return outcome;
    }
  }
  if (outcome === true) {
    for (const handler of handlers) {
      outcome = checkRouteHandlerReturnValue(
        await handler.target[handler.config.handler](...getHandlerParams(handler.config, handler.target, to, from)),
        handler.class
      );
      if (outcome !== true) {
        return outcome;
      }
    }
  }
  return true;
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

export * from './decorators.ts';
