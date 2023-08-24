import { defineMetadata, getMetadata, getRegisteredClass, registerRoutableObject } from './registry.ts';
import { FROM_METADATA, HANDLER_ARGS_METADATA, META_METADATA, PARAM_METADATA, QUERY_METADATA, TO_METADATA } from './symbols.ts';
import type { RouteMatchExpression, RouteResolver, RouteWatcherConfig } from './types.ts';

type PlainDecoratorSignature = [
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
];

type RouteHandlerParams = [{ priority: number }?];

export function RouteMatcher(
  target: RouteResolver,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const config = getRegisteredClass(target);
  (config!.activeRoutes as Array<any>).push((target as any)[propertyKey]);
}

export function RouteActivated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteActivated decorator must be used with brachkets: RouteActivated(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target);
    config!.activate = {
      priority,
      handler: propertyKey
    };
  };
}

export function RouteDeactivated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteDeactivated decorator must be used with brachkets: RouteDeactivated(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target);
    config!.deactivate = {
      priority,
      handler: propertyKey
    };
  };
}

export function RouteUpdated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteUpdated decorator must be used with brachkets: RouteUpdated(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target);
    config!.update = {
      priority,
      handler: propertyKey
    };
  };
}

export function GuardRouteEnter(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'GuardRouteEnter decorator must be used with brachkets: GuardRouteEnter(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target);
    config!.guardEnter = {
      priority,
      handler: propertyKey
    };
  };
}


export function RouteWatcher(config : RouteWatcherConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const classConfig = getRegisteredClass(target);
    if(config.on && !Array.isArray(config.on))
      config.on = [config.on];
    classConfig.watchers.push(Object.assign({}, config, {handler : propertyKey}));
  };
}

export function GuardRouteLeave(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'GuardRouteLeave decorator must be used with brachkets: GuardRouteLeave(config?)'
    );
  const priority = (args as RouteHandlerParams)[0]?.priority || 0;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const config = getRegisteredClass(target);

    config!.guardLeave = {
      priority,
      handler: propertyKey
    };
  };
}

export function Routable(
  arg?: RouteMatchExpression
): Function {
  return function (OriginalConstructor: any) {
    const config = getRegisteredClass(OriginalConstructor.prototype);
    config.class = OriginalConstructor.name;

    if (arg && (!Array.isArray(arg) || (arg as Array<any>).length)) {
      const all = Array.isArray(arg) ? arg : [arg];
      (config.activeRoutes as Array<any>).push(...(all || []));
    }

    function newConstructor(...args: any[]) {
      const instance = new OriginalConstructor(...args);
      registerRoutableObject(instance);
      return instance;
    }

    // Set prototype to ensure instance methods and properties are preserved
    newConstructor.prototype = OriginalConstructor.prototype;
    return newConstructor;
  };
}

function getHandlerArgsMetadataDecorator(type :symbol, ...args: any[]) {
  return function (target: Object, propertyKey: string, parameterIndex: number) {
    const handlerArgs:Array<any> = getMetadata(HANDLER_ARGS_METADATA, target, propertyKey) || [];
    handlerArgs[parameterIndex] = { type, args };
    defineMetadata(HANDLER_ARGS_METADATA, handlerArgs, target, propertyKey);
  };
}

export function Param(name?: string) {
  return getHandlerArgsMetadataDecorator(PARAM_METADATA, ...(name ? [name] : []));
}

export function To(propertyPath?:string) {
  return getHandlerArgsMetadataDecorator(TO_METADATA, ...(propertyPath ? [propertyPath] : []));
}

export function From(propertyPath?:string) {
  return getHandlerArgsMetadataDecorator(FROM_METADATA, ...(propertyPath ? [propertyPath] : []));
}

export function Query(name?:string) {
  return getHandlerArgsMetadataDecorator(QUERY_METADATA, ...(name ? [name] : []));
}

export function Meta(path?: string) {
  return getHandlerArgsMetadataDecorator(META_METADATA, ...(path ? [path] : []));
}
