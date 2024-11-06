import get from 'lodash.get';
import type { RouteLocation, RouteRecordNormalized, RouteRecordRaw } from 'vue-router';
import { getMetadata, getRegisteredClass, routeableObjects } from './registry';
import { FROM_METADATA, HANDLER_ARGS_METADATA, META_METADATA, PARAM_METADATA, QUERY_METADATA, TO_METADATA } from './symbols';
import type { GuardConfig, HandlerParamMetadata, RoutableConfig, RouteChangeHandlerConfig, RouteHandlerEventType, RouteMatchConfig, RouteMatchExpression, RouteWatcherContext, RoutingConfig } from './types';


type RoutableCallableConfig = {
    target : any
    class : string
    config : GuardConfig | RouteChangeHandlerConfig
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
  export async function handleRouteChange(to: RouteLocation, from: RouteLocation) : Promise<any> {
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
  /**
   * Checks if the given route matches the provided route match expression(s).
   *
   * @param {RouteLocation} route - The route to check.
   * @param {RouteMatchExpression} expression - The route match expression to compare against.
   * @return {boolean} - Returns true if the route matches any of the expressions, otherwise returns false.
   */
  function routeMatches(route : RouteLocation, {expression, target} : RouteMatchConfig) : boolean {
    const matchTarget = get(route, target);
    if(Array.isArray(expression)) {
      return expression.some((subexp) => routeMatches(route, {expression : subexp, target}));
    }
    if ((expression as any) instanceof RegExp) {
      return (expression as RegExp).test(matchTarget as string);
    } else if (typeof expression === 'string') {
      return expression === matchTarget;
    } else {
      return (expression as Function)(matchTarget);
    }
  }
  

  function routeChainMatches(route : RouteLocation, config : RouteMatchConfig) : boolean {
    return !!route.matched.find(route => routeMatches(route, config))
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
    const metadata = getMetadata(
      HANDLER_ARGS_METADATA,
      Object.getPrototypeOf(target),
      methodName
    ) || [];
    
    const params = metadata.map((param: HandlerParamMetadata) => {
      const { type, args } = param;
      switch (type) {
        case PARAM_METADATA:
          return args.length ? to.params[args[0]] : to.params;
        case QUERY_METADATA:
          return args.length ? to.query[args[0]] : to.query;
        case META_METADATA:
          return args.length ? get(to.meta, args[0]) : to.meta;
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
    return Array.from(routeableObjects).reduce((out:Array<RoutableCallableConfig>, routable) => {
      const config = getRegisteredClass(Object.getPrototypeOf(routable));
      if (config.guardEnter && routeMatches(to, config.activeRoutes)) {
        out.push({ config: config.guardEnter, class: config.class!, target: routable });
      }
      if (config.guardLeave && routeMatches(from, config.activeRoutes)) {
        out.push({ config: config.guardLeave, class: config.class!, target: routable });
      }
      return out;
    }, [])
    
  }
  
  /**
   * Returns an array of RoutableCallableConfig objects representing the handlers for a given route transition.
   *
   * @param {RouteLocation} to - The target route location object.
   * @param {RouteLocation} from - The source route location object.
   * @return {Array<RoutableCallableConfig>} - An array of RoutableCallableConfig objects representing the handlers for the route transition.
   */
  function getHandlers(to: RouteLocation, from: RouteLocation) {
    return Array.from(routeableObjects).reduce((out: Array<RoutableCallableConfig>, routable) => {
      const config = getRegisteredClass(Object.getPrototypeOf(routable));
      if (to.name !== from.name) {
        if (config.activate && routeMatches(to, config.activeRoutes) && !routeChainMatches(from, config.activeRoutes)) {
          out.push({ config: config.activate, class: config.class!, target: routable });
        }
        else if (config.deactivate && !routeChainMatches(to, config.activeRoutes)&& routeChainMatches(from, config.activeRoutes)) {
          out.push({ config: config.deactivate, class: config.class!, target: routable });
        }
      } else if (config.update) {
        out.push({ config: config.update, class: config.class!, target: routable });
      }
      return out;
    }, [])
  }
  
  function sortGuardsAndHandlers(guards:Array<RoutableCallableConfig>, handlers:Array<RoutableCallableConfig>) {
    const sortByPriority = (a:RoutableCallableConfig, b:RoutableCallableConfig) => 
      Number(b.config.priority) - Number(a.config.priority);
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
  async function processGuards(guards:Array<RoutableCallableConfig>, to: RouteLocation, from:RouteLocation) {
    for (const guard of guards) {
      const outcome = checkRouteHandlerReturnValue(
        await guard.target[guard.config.handler](...getHandlerParams(guard.config.handler, guard.target, to, from)),
        guard.class
      );
      if (outcome !== true) return outcome;
    }
    return true;
  }
  
  /**
   * Process the given array of handlers for a specific route transition.
   * Also flags the route as active or inactive based on the enter/leave configuration
   *
   * @param {Array<RoutableCallableConfig>} handlers - The array of handlers to process.
   * @param {RouteLocation} to - The destination route location.
   * @param {RouteLocation} from - The source route location.
   * @return {boolean | Outcome} - The outcome of the process.
   */
  async function processHandlers(handlers:Array<RoutableCallableConfig>, to: RouteLocation, from:RouteLocation) {
    for (const handler of handlers) {
      const outcome = checkRouteHandlerReturnValue(
        await handler.target[handler.config.handler](...getHandlerParams(handler.config.handler, handler.target, to, from)),
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
  function watcherApplies(context: RouteWatcherContext, to: RouteLocation, from:RouteLocation) {
    const contextMatch = context.match as RouteMatchConfig;
    const contextOn = context.on as RouteHandlerEventType[];
    const matchesTo = !contextMatch || routeMatches(to, contextMatch);
    const matchesFrom = !contextMatch || routeMatches(from, contextMatch);
    
    if(matchesTo && to.name === from.name && (!contextOn || contextOn.includes('update'))) {
      return true;
    }
    if(matchesTo && contextOn?.includes('enter')) {
        return true;
    }
    if(matchesFrom && contextOn?.includes('leave')) {
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
  export function getActiveRoutablesConfigs(to: RouteLocation, from:RouteLocation) : Array<{config: RoutableConfig, target: any}> {
    return Array.from(routeableObjects)
      .map(obj => ({ 
        target : obj, 
        config: getRegisteredClass(Object.getPrototypeOf(obj))
      }))
      .filter(obj => routeMatches(to, obj.config.activeRoutes) || routeMatches(from, obj.config.activeRoutes))
  }
  
  /**
   * Retrieves an array of prioritised active watchers based on the provided route locations.
   *
   * @param {RouteLocation} to - The destination route location.
   * @param {RouteLocation} from - The source route location.
   * @return {Array<RouteWatcherContext>} - An array of prioritised active watchers.
   */
  function getPrioritisedActiveWatchers(to: RouteLocation, from:RouteLocation) : Array<RouteWatcherContext> {
    return getActiveRoutablesConfigs(to, from)
      .flatMap(curr => (curr.config.watchers?.map((watcherConfig:RouteWatcherContext) => ({ 
          ...watcherConfig,
          target: curr.target
    })) || []))
      .filter(context => watcherApplies(context, to, from))
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
  async function processWatcher(context: RouteWatcherContext, to: RouteLocation, from:RouteLocation) {
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
  async function processWatchers(to: RouteLocation, from:RouteLocation) {
    const watchers = getPrioritisedActiveWatchers(to, from);
    for(const watcher of watchers) {
      await processWatcher(watcher, to, from);
    }
  }