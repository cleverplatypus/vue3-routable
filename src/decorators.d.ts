import type { RouteChangeHandlerDecoratorConfig, RouteMatchExpression, RouteMatchTarget, RouteWatcherConfig } from './types';
type PlainDecoratorSignature = [
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
];
type PriorityDecoratorParams = [{
    priority?: number;
}?];
type RouteHandlerParams = [RouteChangeHandlerDecoratorConfig?];
/**
 * @category Decorators: Method
 * @decorator
 */
export declare function RouteMatcher(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function RouteActivated(...args: PlainDecoratorSignature | RouteHandlerParams): (target: any, propertyKey: string) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function RouteDeactivated(...args: PlainDecoratorSignature | RouteHandlerParams): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function RouteUpdated(...args: PlainDecoratorSignature | RouteHandlerParams): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function GuardRouteEnter(...args: PlainDecoratorSignature | PriorityDecoratorParams): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function RouteWatcher(config: RouteWatcherConfig): (target: any, propertyKey: string, _: PropertyDescriptor) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function GuardRouteLeave(...args: PlainDecoratorSignature | PriorityDecoratorParams): (target: any, propertyKey: string, _: PropertyDescriptor) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function Routable(arg?: RouteMatchExpression | RouteMatchExpression[], target?: RouteMatchTarget): Function;
/**
 * @category Decorators
 * @decorator
 */
export declare function Param(name?: string): (target: Object, propertyKey: string, parameterIndex: number) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function To(propertyPath?: string): (target: Object, propertyKey: string, parameterIndex: number) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function From(propertyPath?: string): (target: Object, propertyKey: string, parameterIndex: number) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function Query(name?: string): (target: Object, propertyKey: string, parameterIndex: number) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function Meta(path?: string): (target: Object, propertyKey: string, parameterIndex: number) => void;
/**
 * @category Decorators
 * @decorator
 */
export declare function HandlerInfo(): (target: Object, propertyKey: string, parameterIndex: number) => void;
export {};
