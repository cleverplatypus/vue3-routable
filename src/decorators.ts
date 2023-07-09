import { getRegisteredClass, registerRoutableObject } from './registry.ts';
import { RouteChangeHandler, RouteResolver } from './types.ts';

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

export function RouteActivated(...args : PlainDecoratorSignature | RouteHandlerParams) {
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
      handler: (target as any)[propertyKey].bind(target),
    };
  };
}

export function RouteDeactivated(...args : PlainDecoratorSignature | RouteHandlerParams) {
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
      handler: (target as any)[propertyKey].bind(target),
    };
  };
}

export function RouteUpdated(...args : PlainDecoratorSignature | RouteHandlerParams) {
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
      handler: (target as any)[propertyKey].bind(target),
    };
  };
}

export function GuardRouteEnter(...args : PlainDecoratorSignature | RouteHandlerParams) {
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
    config!.guardEnter = { priority, handler: (target as any)[propertyKey] };
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
    config!.guardLeave = { priority, handler: (target as any)[propertyKey] };
  };
}

export function Routable(
  arg?: Array<string | RegExp> | string | RegExp | RouteResolver
): Function {
  return function (ctor: any) {
    const config = getRegisteredClass(ctor.prototype);
    config.class = ctor.name;
    if (arg && (!Array.isArray(arg) || (arg as Array<any>).length)) {
      const all = Array.isArray(arg) ? arg : [arg];
      config.activeRoutes.push(...(all || []));
    }
    return class extends ctor {
      constructor(...args: [any]) {
        super(...args);
        registerRoutableObject(this);
      }
    };
  };
}
