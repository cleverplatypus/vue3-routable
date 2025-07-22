import {
  defineMetadata,
  getMetadata,
  getRegisteredClass,
  registerRoutableObject,
} from './registry';
import {
  FROM_METADATA,
  HANDLER_ARGS_METADATA,
  META_METADATA,
  PARAM_METADATA,
  QUERY_METADATA,
  TO_METADATA,
} from './symbols';
import type {
  MetaDecoratorArgs,
  RouteMatchExpression,
  RouteMatchTarget,
  RouteResolver,
  RouteWatcherConfig,
} from './types';

type PlainDecoratorSignature = [
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
];

type RouteHandlerParams = [{ priority: number }?];

/**
 * @category Decorators: Method
 * @decorator
 */
export function RouteMatcher() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target, true);
    config!.routeMatcher = (target as any)[propertyKey] as RouteResolver;
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function RouteActivated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteActivated decorator must be used with brackets: RouteActivated(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (target: any, propertyKey: string) {
    const config = getRegisteredClass(target, true);
    config!.activate = {
      priority,
      handler: propertyKey,
    };
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function RouteDeactivated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteDeactivated decorator must be used with brackets: RouteDeactivated(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target, true);
    config!.deactivate = {
      priority,
      handler: propertyKey,
    };
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function RouteUpdated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteUpdated decorator must be used with brackets: RouteUpdated(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target, true);
    config!.update = {
      priority,
      handler: propertyKey,
    };
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function GuardRouteEnter(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'GuardRouteEnter decorator must be used with brackets: GuardRouteEnter(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target, true);
    config!.guardEnter = {
      priority,
      handler: propertyKey,
    };
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function RouteWatcher(config: RouteWatcherConfig) {
  return function (target: any, propertyKey: string, _: PropertyDescriptor) {
    if (
      config?.match &&
      (!Array.isArray(config.match) || (config.match as Array<any>).length)
    ) {
      config.match = Array.isArray(config.match)
        ? config.match
        : [config.match];
    }

    const classConfig = getRegisteredClass(target, true);
    if (config?.on && !Array.isArray(config.on)) config.on = [config.on];
    classConfig.watchers.push(
      Object.assign({}, config, { handler: propertyKey })
    );
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function GuardRouteLeave(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'GuardRouteLeave decorator must be used with brackets: GuardRouteLeave(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (target: any, propertyKey: string, _: PropertyDescriptor) {
    const config = getRegisteredClass(target, true);

    config!.guardLeave = {
      priority,
      handler: propertyKey,
    };
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function Routable(
  arg?: RouteMatchExpression | RouteMatchExpression[],
  target?: RouteMatchTarget
): Function {
  return function (OriginalConstructor: any) {
    const config = getRegisteredClass(OriginalConstructor.prototype, true);
    config.class = OriginalConstructor.name;
    config.matchTarget = target

    if (arg && (!Array.isArray(arg) || (arg as Array<any>).length)) {
      const all = Array.isArray(arg) ? arg : [arg];
      (config.activeRoutes as Array<any>).push(...(all || []));
    }

    function newConstructor(...args: any[]) {
      const instance = new OriginalConstructor(...args);
      if (config.routeMatcher)
        config.instanceRouteMatchers.set(
          instance,
          config.routeMatcher.bind(instance)
        );
      registerRoutableObject(instance);
      return instance;
    }

    // Set prototype to ensure instance methods and properties are preserved
    newConstructor.prototype = OriginalConstructor.prototype;
    return newConstructor;
  };
}

function getHandlerArgsMetadataDecorator(type: symbol, ...args: any[]) {
  return function (
    target: Object,
    propertyKey: string,
    parameterIndex: number
  ) {
    const handlerArgs: Array<any> =
      getMetadata(HANDLER_ARGS_METADATA, target, propertyKey) || [];
    handlerArgs[parameterIndex] = { type, args };
    defineMetadata(HANDLER_ARGS_METADATA, handlerArgs, target, propertyKey);
  };
}

/**
 * @category Decorators
 * @decorator
 */
export function Param(name?: string) {
  return getHandlerArgsMetadataDecorator(
    PARAM_METADATA,
    ...(name ? [name] : [])
  );
}

/**
 * @category Decorators
 * @decorator
 */
export function To(propertyPath?: string) {
  return getHandlerArgsMetadataDecorator(
    TO_METADATA,
    ...(propertyPath ? [propertyPath] : [])
  );
}

/**
 * @category Decorators
 * @decorator
 */
export function From(propertyPath?: string) {
  return getHandlerArgsMetadataDecorator(
    FROM_METADATA,
    ...(propertyPath ? [propertyPath] : [])
  );
}

/**
 * @category Decorators
 * @decorator
 */
export function Query(name?: string) {
  return getHandlerArgsMetadataDecorator(
    QUERY_METADATA,
    ...(name ? [name] : [])
  );
}

/**
 * @category Decorators
 * @decorator
 */
export function Meta(path?: string) {
  return getHandlerArgsMetadataDecorator(
    META_METADATA,
    ...(path ? [path] : [])
  );
}
