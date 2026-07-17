import get from 'lodash.get';
import { getMetadata, getRegisteredClass } from './registry';
import { defaultRoutableRuntime } from './runtime';
import { FROM_METADATA, HANDLER_ARGS_METADATA, META_METADATA, PARAM_METADATA, QUERY_METADATA, THIS_HANDLER_METADATA, TO_METADATA, } from './symbols';
let lazyRoutableRegistry;
const cancelledHandlersByRuntime = new WeakMap();
/**
 * Sets the meta pathName property for each route in the given root and routes arrays.
 *
 * @param {Array<RouteRecordNormalized>} root - The root array of routes.
 * @param {Array<RouteRecordNormalized>} routes - The array of routes.
 * @param {string} [parentPath=''] - The parent path string.
 */
export const routesLUT = defaultRoutableRuntime.routesLUT;
function toRouteBaseInfo(route) {
    return {
        name: route.name,
        path: route.path,
        meta: route.meta,
    };
}
function getExecutionRuntime() {
    return typeof globalThis.window !== 'undefined' &&
        typeof globalThis.document !== 'undefined'
        ? 'browser'
        : 'ssr';
}
function matchesHandlerRuntime(policy, runtime) {
    return !policy || policy === 'both' || policy === runtime;
}
function toHandlerCancellationKey(kind, handler) {
    return `${kind}:${handler}`;
}
function getCancelledHandlers(runtime, target) {
    let handlersByTarget = cancelledHandlersByRuntime.get(runtime);
    if (!handlersByTarget) {
        handlersByTarget = new WeakMap();
        cancelledHandlersByRuntime.set(runtime, handlersByTarget);
    }
    let cancelledHandlers = handlersByTarget.get(target);
    if (!cancelledHandlers) {
        cancelledHandlers = new Set();
        handlersByTarget.set(target, cancelledHandlers);
    }
    return cancelledHandlers;
}
function isHandlerCancelled(runtime, target, kind, handler) {
    return getCancelledHandlers(runtime, target).has(toHandlerCancellationKey(kind, handler));
}
function createHandlerSubscription(runtime, target, kind, handler, executionRuntime) {
    return {
        detach() {
            getCancelledHandlers(runtime, target).add(toHandlerCancellationKey(kind, handler));
        },
        get runtime() {
            return executionRuntime;
        },
    };
}
export function createRoutesLUT(router, runtime = defaultRoutableRuntime) {
    runtime.routesLUT.clear();
    const traverseRoutes = (routes, parentChain = []) => {
        for (const originalRoute of routes) {
            const route = {
                name: originalRoute.name,
                path: originalRoute.path,
                meta: originalRoute.meta,
            };
            const currentChain = [...parentChain, route];
            const namesInChain = currentChain
                .map((r) => r.name)
                .filter((name) => name != null);
            if (route.name) {
                const nameChain = namesInChain.join(runtime.config.routeNameChainSeparator);
                runtime.routesLUT.set(String(route.name), {
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
 * Lazy loads any routes that match the given route.
 * @param to the route to check
 */
async function lazyLoadRoutables(to, runtime = defaultRoutableRuntime) {
    if (!runtime.lazyRoutableRegistry) {
        try {
            //@ts-ignore virtual module import can confuse typescript
            const mod = await import('virtual:vue3-routable-manifest');
            runtime.lazyRoutableRegistry = (mod.RoutableRegistry ?? []).map((entry) => ({ ...entry }));
        }
        catch (e) {
            runtime.lazyRoutableRegistry = [];
            console.debug('[vue3-routable] No lazyRoutableRegistry found. Lazy routes will not be loaded.');
        }
    }
    const lazyRegistry = runtime.lazyRoutableRegistry || [];
    const remainingLazyEntries = [];
    for (const lazyRoutable of lazyRegistry) {
        if (!lazyRoutable.loaded &&
            routeChainMatches(to, {
                expression: lazyRoutable.match,
                target: lazyRoutable.matchTarget || runtime.config.defaultMatchTarget,
            }, runtime)) {
            const loaded = await lazyRoutable.loader();
            await runtime.onLazyRoutableModuleLoaded?.(loaded);
            lazyRoutable.loaded = true;
        }
        else if (!lazyRoutable.loaded) {
            remainingLazyEntries.push(lazyRoutable);
        }
    }
    runtime.lazyRoutableRegistry = remainingLazyEntries;
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
export async function handleRouteChange(to, from, runtime = defaultRoutableRuntime) {
    const runRouteChange = async () => {
        await lazyLoadRoutables(to, runtime);
        const guards = getGuards(to, from, runtime);
        const handlers = getHandlers(to, from, runtime);
        sortGuardsAndHandlers(guards, handlers);
        const guardOutcome = await processGuards(guards, to, from, runtime);
        let handlerOutcome = true;
        if (guardOutcome === true) {
            handlerOutcome = await processHandlers(handlers, to, from, runtime);
        }
        await processWatchers(to, from, runtime);
        return guardOutcome === true ? handlerOutcome : guardOutcome;
    };
    if (runtime.runWithContext) {
        return runtime.runWithContext(runRouteChange);
    }
    return runRouteChange();
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
function checkRouteHandlerReturnValue(val, clazz) {
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
    if (typeof val === 'object' &&
        (val.hasOwnProperty('name') || val.hasOwnProperty('path'))) {
        return val;
    }
    throwError();
}
/**
 * Converts a route pattern with parameters (e.g., /product/:id) to a RegExp
 * @param pattern - The route pattern string
 * @returns RegExp that matches the pattern
 */
function createRoutePatternRegex(pattern) {
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escapedPattern.replace(/:([^/]+)/g, '([^/]+)');
    return new RegExp(`^${regexPattern}$`);
}
/**
 * Checks if the given route matches the provided route match expression(s).
 *
 * @param {RouteLocation} route - The route to check.
 * @param {RouteMatchExpression} expression - The route match expression to compare against.
 * @return {boolean} - Returns true if the route matches any of the expressions, otherwise returns false.
 */
export function routeMatches(route, targetedExpression, runtime = defaultRoutableRuntime) {
    const { expression, target } = targetedExpression;
    const matchTarget = target || runtime.config.defaultMatchTarget;
    if (Array.isArray(expression)) {
        return expression.some((subexp) => routeMatches(route, {
            expression: subexp,
            target: matchTarget
        }, runtime));
    }
    const matchTargetValue = matchTarget === 'name-chain'
        ? runtime.routesLUT.get(route.name)?.nameChain
        : get(route, matchTarget);
    // Handle RegExp expressions
    if (expression instanceof RegExp) {
        return expression.test(matchTargetValue);
    }
    // Handle function expressions
    if (typeof expression === 'function') {
        return expression(route);
    }
    // Handle string expressions
    if (typeof expression !== 'string') {
        return false;
    }
    // Check for dynamic route patterns when matching against path
    const isDynamicPattern = expression.includes(':');
    const isMatchingPath = matchTarget === 'path';
    if (isDynamicPattern && isMatchingPath) {
        try {
            const regex = createRoutePatternRegex(expression);
            return regex.test(matchTargetValue);
        }
        catch (error) {
            console.warn('[vue3-routable] Failed to create route pattern regex, falling back to simple string matching:', error);
        }
    }
    // Default to simple string matching
    return expression === matchTargetValue;
}
export function routeChainMatches(route, targetedExpression, runtime = defaultRoutableRuntime) {
    const routeEntry = route.name
        ? runtime.routesLUT.get(route.name)
        : undefined;
    return !!routeEntry?.matched.find((currentRoute) => routeMatches({ ...currentRoute, path: route.path }, targetedExpression, runtime));
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
function getHandlerParams(methodName, target, to, from, context = {}) {
    const metadata = getMetadata(HANDLER_ARGS_METADATA, target, methodName) || [];
    const params = metadata.map((param) => {
        const { type, args } = param;
        switch (type) {
            case PARAM_METADATA:
                return args.length ? to.params[args[0]] : to.params;
            case QUERY_METADATA:
                return args.length ? to.query[args[0]] : to.query;
            case META_METADATA: {
                const [direction, path] = args[0]
                    ? typeof args[0] === 'string'
                        ? ['to', args[0]]
                        : [args[0].route || '', args[0].path]
                    : ['to', undefined];
                const toFrom = { to, from }[direction];
                return path ? get(toFrom.meta, args[0]) : toFrom.meta;
            }
            case TO_METADATA:
                return args.length ? get(to, args[0]) : to;
            case FROM_METADATA:
                return args.length ? get(from, args[0]) : from;
            case THIS_HANDLER_METADATA:
                return context.subscription;
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
function getGuards(to, from, runtime) {
    return Array.from(runtime.routableObjects).reduce((out, routable) => {
        const config = getRegisteredClass(routable);
        if (config.guardEnter &&
            !isHandlerCancelled(runtime, routable, 'guard-enter', config.guardEnter.handler) &&
            routeMatches(toRouteBaseInfo(to), {
                expression: config.activeRoutes,
                target: config.matchTarget,
            }, runtime)) {
            out.push({
                config: config.guardEnter,
                class: config.class,
                target: routable,
                kind: 'guard-enter',
            });
        }
        if (config.guardLeave &&
            !isHandlerCancelled(runtime, routable, 'guard-leave', config.guardLeave.handler) &&
            routeMatches(toRouteBaseInfo(from), {
                expression: config.activeRoutes,
                target: config.matchTarget
            }, runtime)) {
            out.push({
                config: config.guardLeave,
                class: config.class,
                target: routable,
                kind: 'guard-leave',
            });
        }
        return out;
    }, []);
}
/**
 * Checks whether the passed routableObject is activate for the passed route
 *
 * @category Functions
 * @param route the route to match against the object
 * @param routeableObject the object to check
 * @returns
 */
export function routableObjectIsActive(route, routeableObject, runtime = defaultRoutableRuntime) {
    const config = getRegisteredClass(routeableObject);
    if (!config)
        return false;
    return (routeChainMatches(toRouteBaseInfo(route), {
        expression: config.activeRoutes,
        target: config.matchTarget,
    }, runtime) ||
        config.routeMatcher?.call(routeableObject, route) ||
        false);
}
/**
 * Returns an array of RoutableCallableConfig objects representing the handlers for a given route transition.
 *
 * @param {RouteLocation} to - The target route location object.
 * @param {RouteLocation} from - The source route location object.
 * @return {Array<RoutableCallableConfig>} - An array of RoutableCallableConfig objects representing the handlers for the route transition.
 */
function getHandlers(to, from, runtime) {
    const executionRuntime = getExecutionRuntime();
    return Array.from(runtime.routableObjects).reduce((out, routable) => {
        const config = getRegisteredClass(routable);
        const instanceMatchesTo = config.instanceRouteMatchers.has(routable) &&
            config.instanceRouteMatchers.get(routable).call(routable, to);
        const instanceMatchesFrom = config.instanceRouteMatchers.has(routable) &&
            config.instanceRouteMatchers.get(routable).call(routable, from);
        const matchesTo = instanceMatchesTo ||
            routeChainMatches(toRouteBaseInfo(to), {
                expression: config.activeRoutes,
                target: config.matchTarget
            }, runtime);
        const matchesFrom = instanceMatchesFrom ||
            routeChainMatches(toRouteBaseInfo(from), {
                expression: config.activeRoutes,
                target: config.matchTarget
            }, runtime);
        if (!matchesFrom && !matchesTo)
            return out;
        if (to.name !== from.name) {
            if (config.activate &&
                matchesTo &&
                !matchesFrom &&
                matchesHandlerRuntime(config.activate.runtime, executionRuntime) &&
                !isHandlerCancelled(runtime, routable, 'activate', config.activate.handler)) {
                out.push({
                    config: config.activate,
                    class: config.class,
                    target: routable,
                    kind: 'activate',
                });
            }
            else if (config.deactivate &&
                !matchesTo &&
                matchesFrom &&
                matchesHandlerRuntime(config.deactivate.runtime, executionRuntime) &&
                !isHandlerCancelled(runtime, routable, 'deactivate', config.deactivate.handler)) {
                out.push({
                    config: config.deactivate,
                    class: config.class,
                    target: routable,
                    kind: 'deactivate',
                });
            }
        }
        else if (config.update &&
            matchesHandlerRuntime(config.update.runtime, executionRuntime) &&
            !isHandlerCancelled(runtime, routable, 'update', config.update.handler)) {
            out.push({
                config: config.update,
                class: config.class,
                target: routable,
                kind: 'update',
            });
        }
        return out;
    }, []);
}
function sortGuardsAndHandlers(guards, handlers) {
    const sortByPriority = (a, b) => Number(b.config.priority) - Number(a.config.priority);
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
async function processGuards(guards, to, from, runtime) {
    const executionRuntime = getExecutionRuntime();
    for (const guard of guards) {
        const subscription = createHandlerSubscription(runtime, guard.target, guard.kind, guard.config.handler, executionRuntime);
        const outcome = checkRouteHandlerReturnValue(await guard.target[guard.config.handler](...getHandlerParams(guard.config.handler, guard.target, to, from, {
            subscription,
        })), guard.class);
        if (outcome !== true)
            return outcome;
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
async function processHandlers(handlers, to, from, runtime) {
    const executionRuntime = getExecutionRuntime();
    for (const handler of handlers) {
        const subscription = createHandlerSubscription(runtime, handler.target, handler.kind, handler.config.handler, executionRuntime);
        const outcome = checkRouteHandlerReturnValue(await handler.target[handler.config.handler](...getHandlerParams(handler.config.handler, handler.target, to, from, {
            subscription,
        })), handler.class);
        if (outcome !== true)
            return outcome;
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
function watcherApplies(context, to, from, runtime) {
    const contextOn = context.on;
    const matchesTo = !context.match || routeMatches(toRouteBaseInfo(to), {
        expression: context.match,
        target: context.target
    }, runtime);
    const matchesFrom = !context.match || routeMatches(toRouteBaseInfo(from), {
        expression: context.match,
        target: context.target
    }, runtime);
    if (matchesTo &&
        to.name === from.name &&
        (!contextOn || contextOn.includes('update'))) {
        return true;
    }
    if (matchesTo && (!contextOn || contextOn?.includes('enter'))) {
        return true;
    }
    if (matchesFrom && (!contextOn || contextOn?.includes('leave'))) {
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
export function getActiveRoutablesConfigs(to, from, runtime = defaultRoutableRuntime) {
    const objs = Array.from(runtime.routableObjects).map((obj) => ({
        target: obj,
        config: getRegisteredClass(obj),
    }));
    return objs.filter((obj) => routeChainMatches(toRouteBaseInfo(to), {
        expression: obj.config.activeRoutes,
        target: obj.config.matchTarget
    }, runtime) ||
        routeChainMatches(toRouteBaseInfo(from), {
            expression: obj.config.activeRoutes,
            target: obj.config.matchTarget
        }, runtime));
}
/**
 * Retrieves an array of prioritised active watchers based on the provided route locations.
 *
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 * @return {Array<RouteWatcherContext>} - An array of prioritised active watchers.
 */
function getPrioritisedActiveWatchers(to, from, runtime) {
    const out = getActiveRoutablesConfigs(to, from, runtime).flatMap((curr) => curr.config.watchers?.map((watcherConfig) => ({
        ...watcherConfig,
        target: curr.target,
    })) || []);
    return out
        .filter((context) => watcherApplies(context, to, from, runtime))
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
async function processWatcher(context, to, from, runtime) {
    const subscription = createHandlerSubscription(runtime, context.target, 'watcher', context.handler, getExecutionRuntime());
    await context.target[context.handler](...getHandlerParams(context.handler, context.target, to, from, {
        subscription,
    }));
}
/**
 * Process any configured watchers for the given route transition.
 *
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 */
async function processWatchers(to, from, runtime) {
    const watchers = getPrioritisedActiveWatchers(to, from, runtime);
    for (const watcher of watchers) {
        if (isHandlerCancelled(runtime, watcher.target, 'watcher', watcher.handler)) {
            continue;
        }
        await processWatcher(watcher, to, from, runtime);
    }
}
