import type { RoutableRuntime, RoutingConfig } from './types';
export declare function createRoutableRuntime<TScope = unknown>(options?: Partial<RoutingConfig>, routableRegistry?: Set<object>): RoutableRuntime<TScope>;
export declare const defaultRoutableRuntime: RoutableRuntime;
