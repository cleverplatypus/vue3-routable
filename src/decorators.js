import { defineMetadata, getMetadata, getRegisteredClass, registerRoutableObject, } from './registry';
import { FROM_METADATA, HANDLER_ARGS_METADATA, META_METADATA, PARAM_METADATA, QUERY_METADATA, THIS_HANDLER_METADATA, TO_METADATA, } from './symbols';
/**
 * @category Decorators: Method
 * @decorator
 */
export function RouteMatcher() {
    return function (target, propertyKey, descriptor) {
        const config = getRegisteredClass(target, true);
        config.routeMatcher = target[propertyKey];
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function RouteActivated(...args) {
    if (args.length === 3)
        throw new Error('RouteActivated decorator must be used with brackets: RouteActivated(config?)');
    const options = args[0] || {};
    return function (target, propertyKey) {
        const config = getRegisteredClass(target, true);
        config.activate = {
            priority: options.priority || 0,
            runtime: options.runtime || 'both',
            handler: propertyKey,
        };
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function RouteDeactivated(...args) {
    if (args.length === 3)
        throw new Error('RouteDeactivated decorator must be used with brackets: RouteDeactivated(config?)');
    const options = args[0] || {};
    return function (target, propertyKey, descriptor) {
        const config = getRegisteredClass(target, true);
        config.deactivate = {
            priority: options.priority || 0,
            runtime: options.runtime || 'both',
            handler: propertyKey,
        };
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function RouteUpdated(...args) {
    if (args.length === 3)
        throw new Error('RouteUpdated decorator must be used with brackets: RouteUpdated(config?)');
    const options = args[0] || {};
    return function (target, propertyKey, descriptor) {
        const config = getRegisteredClass(target, true);
        config.update = {
            priority: options.priority || 0,
            runtime: options.runtime || 'both',
            handler: propertyKey,
        };
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function GuardRouteEnter(...args) {
    if (args.length === 3)
        throw new Error('GuardRouteEnter decorator must be used with brackets: GuardRouteEnter(config?)');
    const priority = args[0]?.priority || 0;
    return function (target, propertyKey, descriptor) {
        const config = getRegisteredClass(target, true);
        config.guardEnter = {
            priority,
            handler: propertyKey,
        };
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function RouteWatcher(config) {
    return function (target, propertyKey, _) {
        if (config?.match &&
            (!Array.isArray(config.match) || config.match.length)) {
            config.match = Array.isArray(config.match)
                ? config.match
                : [config.match];
        }
        const classConfig = getRegisteredClass(target, true);
        if (config?.on && !Array.isArray(config.on))
            config.on = [config.on];
        classConfig.watchers.push(Object.assign({}, config, { handler: propertyKey }));
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function GuardRouteLeave(...args) {
    if (args.length === 3)
        throw new Error('GuardRouteLeave decorator must be used with brackets: GuardRouteLeave(config?)');
    const priority = args[0]?.priority || 0;
    return function (target, propertyKey, _) {
        const config = getRegisteredClass(target, true);
        config.guardLeave = {
            priority,
            handler: propertyKey,
        };
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function Routable(arg, target) {
    return function (OriginalConstructor) {
        const config = getRegisteredClass(OriginalConstructor.prototype, true);
        config.class = OriginalConstructor.name;
        config.matchTarget = target;
        if (arg && (!Array.isArray(arg) || arg.length)) {
            const all = Array.isArray(arg) ? arg : [arg];
            config.activeRoutes.push(...(all || []));
        }
        function newConstructor(...args) {
            const instance = new OriginalConstructor(...args);
            if (config.routeMatcher)
                config.instanceRouteMatchers.set(instance, config.routeMatcher.bind(instance));
            registerRoutableObject(instance);
            return instance;
        }
        // Set prototype to ensure instance methods and properties are preserved
        newConstructor.prototype = OriginalConstructor.prototype;
        return newConstructor;
    };
}
function getHandlerArgsMetadataDecorator(type, ...args) {
    return function (target, propertyKey, parameterIndex) {
        const handlerArgs = getMetadata(HANDLER_ARGS_METADATA, target, propertyKey) || [];
        handlerArgs[parameterIndex] = { type, args };
        defineMetadata(HANDLER_ARGS_METADATA, handlerArgs, target, propertyKey);
    };
}
/**
 * @category Decorators
 * @decorator
 */
export function Param(name) {
    return getHandlerArgsMetadataDecorator(PARAM_METADATA, ...(name ? [name] : []));
}
/**
 * @category Decorators
 * @decorator
 */
export function To(propertyPath) {
    return getHandlerArgsMetadataDecorator(TO_METADATA, ...(propertyPath ? [propertyPath] : []));
}
/**
 * @category Decorators
 * @decorator
 */
export function From(propertyPath) {
    return getHandlerArgsMetadataDecorator(FROM_METADATA, ...(propertyPath ? [propertyPath] : []));
}
/**
 * @category Decorators
 * @decorator
 */
export function Query(name) {
    return getHandlerArgsMetadataDecorator(QUERY_METADATA, ...(name ? [name] : []));
}
/**
 * @category Decorators
 * @decorator
 */
export function Meta(path) {
    return getHandlerArgsMetadataDecorator(META_METADATA, ...(path ? [path] : []));
}
/**
 * @category Decorators
 * @decorator
 */
export function HandlerInfo() {
    return getHandlerArgsMetadataDecorator(THIS_HANDLER_METADATA);
}
