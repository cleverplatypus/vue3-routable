import get from "lodash.get";
import type { RouteLocation, Router, RouteRecordRaw } from "vue-router";
import routingConfig from "./config.ts";
import { getMetadata, getRegisteredClass, routeableObjects } from "./registry";
import {
  FROM_METADATA,
  HANDLER_ARGS_METADATA,
  META_METADATA,
  PARAM_METADATA,
  QUERY_METADATA,
  TO_METADATA,
} from "./symbols";
import type {
  GuardConfig,
  HandlerParamMetadata,
  QualifiedMatchExpression,
  RoutableConfig,
  RouteBaseInfo,
  RouteChangeHandlerConfig,
  RouteHandlerEventType,
  RouteMatchExpression,
  RouteMatchTarget,
  RouteWatcherContext,
} from "./types";

type RoutableCallableConfig = {
  target: any;
  class: string;
  config: GuardConfig | RouteChangeHandlerConfig;
};

/**
 * Sets the meta pathName property for each route in the given root and routes arrays.
 *
 * @param {Array<RouteRecordNormalized>} root - The root array of routes.
 * @param {Array<RouteRecordNormalized>} routes - The array of routes.
 * @param {string} [parentPath=''] - The parent path string.
 */
export const routesLUT = new Map<
  string,
  {
    nameChain: string; // the chained route names separated by `nameSeparator`
    matched: RouteBaseInfo[]; // the chain of routes ordered from top route up
  }
>();

function toRouteBaseInfo(route: any): RouteBaseInfo {
  return {
    name: route.name as string,
    path: route.path,
    meta: route.meta,
  };
}

export function createRoutesLUT(router: Router): void {
  const traverseRoutes = (
    routes: readonly RouteRecordRaw[],
    parentChain: RouteBaseInfo[] = []
  ) => {
    for (const originalRoute of routes) {
      const route: RouteBaseInfo = {
        name: originalRoute.name as string,
        path: originalRoute.path,
        meta: originalRoute.meta,
      };
      const currentChain = [...parentChain, route];
      const namesInChain = currentChain
        .map((r) => r.name)
        .filter((name): name is string => name != null);

      if (route.name) {
        const nameChain = namesInChain.join(
          routingConfig.routeNameChainSeparator
        );
        routesLUT.set(String(route.name), {
          nameChain,
          matched: currentChain,
        });
      }

      if (originalRoute.children) {
        traverseRoutes(originalRoute.children, currentChain);
      }
    }
  };

  // Use router options to get the routes
  const routes = router.options.routes;
  traverseRoutes(routes);
}

/**
 * Handles a route change.
 * Any configured Guards, Handlers and Watchers are executed in priority order.
 * This function is passed to the router's beforeEach hook.
 *
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 * @return {boolean | RouteRecordRaw} - The outcome of the route change.
 */
export async function handleRouteChange(
  to: RouteLocation,
  from: RouteLocation
): Promise<any> {
  const guards = getGuards(to, from);
  const handlers = getHandlers(to, from);

  sortGuardsAndHandlers(guards, handlers);

  const guardOutcome = await processGuards(guards, to, from);
  let handlerOutcome: boolean | RouteRecordRaw = true;

  if (guardOutcome === true) {
    handlerOutcome = await processHandlers(handlers, to, from);
  }

  await processWatchers(to, from);
  return guardOutcome === true ? handlerOutcome : guardOutcome;
}

/**
 * Checks the return value of the route handler/guard function.
 *
 * @param {any} val - The return value of the route handler/guard function.
 * @param {string} clazz - The class name of the route handler function.
 * @return {boolean|object} Returns `true` if the return value is `undefined`,
 *         returns `val` if it is a boolean, and returns `val` if it is an
 *         object with a `name` or `path` property. Otherwise, throws an error.
 */
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

  if (typeof val === "boolean") {
    return val;
  }

  if (
    typeof val === "object" &&
    (val.hasOwnProperty("name") || val.hasOwnProperty("path"))
  ) {
    return val;
  }

  throwError();
}
/**
 * Checks if the given route matches the provided route match expression(s).
 *
 * @param {RouteLocation} route - The route to check.
 * @param {RouteMatchExpression} expression - The route match expression to compare against.
 * @return {boolean} - Returns true if the route matches any of the expressions, otherwise returns false.
 */
function routeMatches(
  route: RouteBaseInfo,
  expression: RouteMatchExpression | RouteMatchExpression[]
): boolean {
  if (Array.isArray(expression)) {
    return expression.some((subexp) => routeMatches(route, subexp));
  }

  const targetPath: RouteMatchTarget =
    (expression as QualifiedMatchExpression<any>).target ??
    routingConfig.defaultMatchTarget;

  const matchTarget =
    targetPath === "name-chain"
      ? routesLUT.get(route.name as string)?.nameChain
      : get(route, targetPath);

  if ((expression as any) instanceof RegExp) {
    return (expression as RegExp).test(matchTarget as string);
  } else if (typeof expression === "string") {
    return expression === matchTarget;
  } else {
    return (expression as Function)(route);
  }
}

function routeChainMatches(
  route: RouteBaseInfo,
  expression: RouteMatchExpression | RouteMatchExpression[]
): boolean {
  return (
    !!route.name &&
    !!routesLUT
      .get(route.name as string)!
      .matched.find((r) => routeMatches(r, expression))
  );
}

/**
 * Retrieves the handler parameters based on the provided method name, target object,
 * and route locations.
 *
 * @param {string} methodName - The name of the method being called.
 * @param {Object} target - The the target object
 * @param {RouteLocation} to - The route location representing the destination.
 * @param {RouteLocation} from - The route location representing the origin.
 * @return {Array<any>} An array containing the parameters to be injected
 */
function getHandlerParams(
  methodName: string,
  target: Object,
  to: RouteLocation,
  from: RouteLocation
): Array<any> {
  const metadata = getMetadata(HANDLER_ARGS_METADATA, target, methodName) || [];

  const params = metadata.map((param: HandlerParamMetadata) => {
    const { type, args } = param;
    switch (type) {
      case PARAM_METADATA:
        return args.length ? to.params[args[0]] : to.params;
      case QUERY_METADATA:
        return args.length ? to.query[args[0]] : to.query;
      case META_METADATA: {
        const [direction, path] = args[0]
          ? typeof args[0] === "string"
            ? ["to", args[0]]
            : [args[0].route || "", args[0].path]
          : ["to", undefined];

        const toFrom = { to, from }[direction as "to" | "from"];
        return path ? get(toFrom.meta, args[0]) : toFrom.meta;
      }
      case TO_METADATA:
        return args.length ? get(to, args[0]) : to;
      case FROM_METADATA:
        return args.length ? get(from, args[0]) : from;
    }
  });

  return params;
}

/**
 * Retrieves an array of guards based on the provided `to` and `from` route locations.
 *
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The current route location.
 * @return {Array<RoutableCallableConfig>} An array of `RoutableCallableConfig` objects representing the guards.
 */
function getGuards(to: RouteLocation, from: RouteLocation) {
  return Array.from(routeableObjects).reduce(
    (out: Array<RoutableCallableConfig>, routable) => {
      const config = getRegisteredClass(routable);
      if (
        config.guardEnter &&
        routeMatches(toRouteBaseInfo(to), config.activeRoutes)
      ) {
        out.push({
          config: config.guardEnter,
          class: config.class!,
          target: routable,
        });
      }
      if (
        config.guardLeave &&
        routeMatches(toRouteBaseInfo(from), config.activeRoutes)
      ) {
        out.push({
          config: config.guardLeave,
          class: config.class!,
          target: routable,
        });
      }
      return out;
    },
    []
  );
}

/**
 * Checks whether the passed routableObject is activate for the passed route
 *
 * @category Functions
 * @param route the route to match against the object
 * @param routeableObject the object to check
 * @returns
 */
export function routableObjectIsActive(
  route: RouteLocation | RouteRecordRaw,
  routeableObject: any
): boolean {
  const config = getRegisteredClass(routeableObject);
  if (!config) return false;

  return (
    routeChainMatches(toRouteBaseInfo(route), config.activeRoutes) ||
    config.routeMatcher?.call(routeableObject, route as RouteLocation) ||
    false
  );
}

/**
 * Returns an array of RoutableCallableConfig objects representing the handlers for a given route transition.
 *
 * @param {RouteLocation} to - The target route location object.
 * @param {RouteLocation} from - The source route location object.
 * @return {Array<RoutableCallableConfig>} - An array of RoutableCallableConfig objects representing the handlers for the route transition.
 */
function getHandlers(to: RouteLocation, from: RouteLocation) {
  return Array.from(routeableObjects).reduce(
    (out: Array<RoutableCallableConfig>, routable) => {
      const config = getRegisteredClass(routable);
      const instanceMatchesTo =
        config.instanceRouteMatchers.has(routable) &&
        config.instanceRouteMatchers.get(routable)!.call(routable, to);

      const instanceMatchesFrom =
        config.instanceRouteMatchers.has(routable) &&
        config.instanceRouteMatchers.get(routable)!.call(routable, from);

      const matchesTo =
        instanceMatchesTo ||
        routeChainMatches(toRouteBaseInfo(to), config.activeRoutes);
      const matchesFrom =
        instanceMatchesFrom ||
        routeChainMatches(toRouteBaseInfo(from), config.activeRoutes);
      if (!matchesFrom && !matchesTo) return out;
      if (to.name !== from.name) {
        if (config.activate && matchesTo && !matchesFrom) {
          out.push({
            config: config.activate,
            class: config.class!,
            target: routable,
          });
        } else if (config.deactivate && !matchesTo && matchesFrom) {
          out.push({
            config: config.deactivate,
            class: config.class!,
            target: routable,
          });
        }
      } else if (config.update) {
        out.push({
          config: config.update,
          class: config.class!,
          target: routable,
        });
      }
      return out;
    },
    []
  );
}

function sortGuardsAndHandlers(
  guards: Array<RoutableCallableConfig>,
  handlers: Array<RoutableCallableConfig>
) {
  const sortByPriority = (
    a: RoutableCallableConfig,
    b: RoutableCallableConfig
  ) => Number(b.config.priority) - Number(a.config.priority);
  guards.sort(sortByPriority);
  handlers.sort(sortByPriority);
}

/**
 * Process the given array of guards for a route transition.
 *
 * @param {Array<RoutableCallableConfig>} guards - The array of guards to process.
 * @param {RouteLocation} to - The destination location of the route transition.
 * @param {RouteLocation} from - The current location of the route transition.
 * @return {Promise<boolean>} - A Promise that resolves to `true` if all guards pass, or a rejection value if any guard fails.
 */
async function processGuards(
  guards: Array<RoutableCallableConfig>,
  to: RouteLocation,
  from: RouteLocation
) {
  for (const guard of guards) {
    const outcome = checkRouteHandlerReturnValue(
      await guard.target[guard.config.handler](
        ...getHandlerParams(guard.config.handler, guard.target, to, from)
      ),
      guard.class
    );
    if (outcome !== true) return outcome;
  }
  return true;
}

/**
 * Process the given array of handlers for a specific route transition.
 *
 * @param {Array<RoutableCallableConfig>} handlers - The array of handlers to process.
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 * @return {boolean | Outcome} - The outcome of the process.
 */
async function processHandlers(
  handlers: Array<RoutableCallableConfig>,
  to: RouteLocation,
  from: RouteLocation
) {
  for (const handler of handlers) {
    const outcome = checkRouteHandlerReturnValue(
      await handler.target[handler.config.handler](
        ...getHandlerParams(handler.config.handler, handler.target, to, from)
      ),
      handler.class
    );
    if (outcome !== true) return outcome;
  }
  return true;
}

/**
 * Determines whether the watcher applies to the given route transition.
 *
 * @param {RouteWatcherContext} context - The route watcher context.
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 * @return {boolean} - Returns true if the watcher applies to the route transition, otherwise returns false.
 */
function watcherApplies(
  context: RouteWatcherContext,
  to: RouteLocation,
  from: RouteLocation
) {
  const contextOn = context.on as RouteHandlerEventType[];
  const matchesTo =
    !context.match || routeMatches(toRouteBaseInfo(to), context.match);
  const matchesFrom =
    !context.match || routeMatches(toRouteBaseInfo(from), context.match);

  if (
    matchesTo &&
    to.name === from.name &&
    (!contextOn || contextOn.includes("update"))
  ) {
    return true;
  }
  if (matchesTo && (!contextOn || contextOn?.includes("enter"))) {
    return true;
  }
  if (matchesFrom && (!contextOn || contextOn?.includes("leave"))) {
    return true;
  }
  return false;
}
/**
 * Retrieves the active routable configurations based on the provided route locations.
 *
 * @param {RouteLocation} to - The target route location.
 * @param {RouteLocation} from - The source route location.
 * @return {Array<{config: RoutableConfig, target: any}>} An array of objects containing the routable configuration and target object.
 */
export function getActiveRoutablesConfigs(
  to: RouteLocation,
  from: RouteLocation
): Array<{ config: RoutableConfig; target: any }> {
  const objs = Array.from(routeableObjects).map((obj) => ({
    target: obj,
    config: getRegisteredClass(obj),
  }));
  return objs.filter(
    (obj) =>
      routeChainMatches(toRouteBaseInfo(to), obj.config.activeRoutes) ||
      routeChainMatches(toRouteBaseInfo(from), obj.config.activeRoutes)
  );
}

/**
 * Retrieves an array of prioritised active watchers based on the provided route locations.
 *
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 * @return {Array<RouteWatcherContext>} - An array of prioritised active watchers.
 */
function getPrioritisedActiveWatchers(
  to: RouteLocation,
  from: RouteLocation
): Array<RouteWatcherContext> {
  const out = getActiveRoutablesConfigs(to, from).flatMap(
    (curr) =>
      curr.config.watchers?.map((watcherConfig: RouteWatcherContext) => ({
        ...watcherConfig,
        target: curr.target,
      })) || []
  );

  return out
    .filter((context) => watcherApplies(context, to, from))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Process the watcher. No return value is passed in the Promise
 *
 * @param {RouteWatcherContext} context - The context of the route watcher.
 * @param {RouteLocation} to - The target route location.
 * @param {RouteLocation} from - The previous route location.
 * @return {Promise<void>} A promise that resolves when the processing is complete.
 */
async function processWatcher(
  context: RouteWatcherContext,
  to: RouteLocation,
  from: RouteLocation
) {
  await context.target![context.handler](
    ...getHandlerParams(context.handler, context.target, to, from)
  );
}

/**
 * Process any configured watchers for the given route transition.
 *
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 */
async function processWatchers(to: RouteLocation, from: RouteLocation) {
  const watchers = getPrioritisedActiveWatchers(to, from);
  for (const watcher of watchers) {
    await processWatcher(watcher, to, from);
  }
}
