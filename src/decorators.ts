import { getRegisteredClass, registerRoutableObject } from './registry.ts';
import { RouteResolver } from './types.ts';

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
  config!.activeRoutes.push((target as any)[propertyKey]);
}

export function RouteActivated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteActivated decorator must be used with brachets: RouteActivated(config?)'
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
      handler: (targetInstance, ...rest) => (targetInstance as any)[propertyKey].call(targetInstance, ...rest),
    };
  };
}

export function RouteDeactivated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteDeactivated decorator must be used with brachets: RouteDeactivated(config?)'
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
      handler: (targetInstance, ...rest) => (targetInstance as any)[propertyKey].call(targetInstance, ...rest),
    };
  };
}

export function RouteUpdated(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'RouteUpdated decorator must be used with brachets: RouteUpdated(config?)'
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
      handler: (targetInstance, ...rest) => (targetInstance as any)[propertyKey].call(targetInstance, ...rest),
    };
  };
}

export function GuardRouteEnter(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'GuardRouteEnter decorator must be used with brachets: GuardRouteEnter(config?)'
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
      handler: (targetInstance, ...rest) => (targetInstance as any)[propertyKey].call(targetInstance, ...rest),
    };
  };
}

export function GuardRouteLeave(
  ...args: PlainDecoratorSignature | RouteHandlerParams
) {
  if (args.length === 3)
    throw new Error(
      'GuardRouteLeave decorator must be used with brachets: GuardRouteLeave(config?)'
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
      handler: (targetInstance, ...rest) => (targetInstance as any)[propertyKey].call(targetInstance, ...rest)
    };
  };
}

export function Routable(
  arg?: Array<string | RegExp> | string | RegExp | RouteResolver
): Function {
  return function (OriginalConstructor: any) {
    const config = getRegisteredClass(OriginalConstructor.prototype);
    config.class = OriginalConstructor.name;

    if (arg && (!Array.isArray(arg) || (arg as Array<any>).length)) {
      const all = Array.isArray(arg) ? arg : [arg];
      config.activeRoutes.push(...(all || []));
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
