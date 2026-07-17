import type { RouteLocation, Router, RouteRecordRaw } from 'vue-router';
import type { RoutableConfig, RoutableRuntime, RouteBaseInfo, RouteTargetedMatchExpression } from './types';
/**
 * Sets the meta pathName property for each route in the given root and routes arrays.
 *
 * @param {Array<RouteRecordNormalized>} root - The root array of routes.
 * @param {Array<RouteRecordNormalized>} routes - The array of routes.
 * @param {string} [parentPath=''] - The parent path string.
 */
export declare const routesLUT: import("./types").RoutesLookupTable;
export declare function createRoutesLUT(router: Router, runtime?: RoutableRuntime): void;
/**
 * Handles a route change.
 * Any configured Guards, Handlers and Watchers are executed in priority order.
 * This function is passed to the router's beforeEach hook.
 *
 * @param {RouteLocation} to - The destination route location.
 * @param {RouteLocation} from - The source route location.
 * @return {boolean | RouteRecordRaw} - The outcome of the route change.
 */
export declare function handleRouteChange(to: RouteLocation, from: RouteLocation, runtime?: RoutableRuntime): Promise<any>;
/**
 * Checks if the given route matches the provided route match expression(s).
 *
 * @param {RouteLocation} route - The route to check.
 * @param {RouteMatchExpression} expression - The route match expression to compare against.
 * @return {boolean} - Returns true if the route matches any of the expressions, otherwise returns false.
 */
export declare function routeMatches(route: RouteBaseInfo, targetedExpression: RouteTargetedMatchExpression, runtime?: RoutableRuntime): boolean;
export declare function routeChainMatches(route: RouteBaseInfo, targetedExpression: RouteTargetedMatchExpression, runtime?: RoutableRuntime): boolean;
/**
 * Checks whether the passed routableObject is activate for the passed route
 *
 * @category Functions
 * @param route the route to match against the object
 * @param routeableObject the object to check
 * @returns
 */
export declare function routableObjectIsActive(route: RouteLocation | RouteRecordRaw, routeableObject: any, runtime?: RoutableRuntime): boolean;
/**
 * Retrieves the active routable configurations based on the provided route locations.
 *
 * @param {RouteLocation} to - The target route location.
 * @param {RouteLocation} from - The source route location.
 * @return {Array<{config: RoutableConfig, target: any}>} An array of objects containing the routable configuration and target object.
 */
export declare function getActiveRoutablesConfigs(to: RouteLocation, from: RouteLocation, runtime?: RoutableRuntime): Array<{
    config: RoutableConfig;
    target: any;
}>;
