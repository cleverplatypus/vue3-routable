import type { InjectionKey } from 'vue';
import type { RouteLocation, RouteRecordRaw, Router } from 'vue-router';
import {
  FROM_METADATA,
  HANDLER_ARGS_METADATA,
  META_METADATA,
  PARAM_METADATA,
  QUERY_METADATA,
  TO_METADATA,
} from './symbols';

type RequireAtLeastOneParameter<T> = {
  [K in keyof T]-?: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];

export type MethodName = string;

export type RouteHandlerEventType = 'enter' | 'leave' | 'update';

export type RouteChangeHandlerConfig = {
  handler: MethodName;
  priority: number;
  class?: string;
};

export type RouteTargetedMatchExpression = {
  expression: RouteMatchExpression | RouteMatchExpression[]
  target?: RouteMatchTarget;
}
  

export type RouteBaseInfo = {
  name: string;
  path: string;
  meta?: Record<string, any>;
};

export type ParamMetadataType =
  | typeof TO_METADATA
  | typeof PARAM_METADATA
  | typeof QUERY_METADATA
  | typeof META_METADATA
  | typeof FROM_METADATA;

/**
 * @ignore
 */
export type MetadataType = typeof HANDLER_ARGS_METADATA;

/**
 * @ignore
 */
export type HandlerParamMetadata = {
  type: ParamMetadataType;
  args: Array<any>;
};
export type RoutingConfig = {
  defaultMatchTarget: RouteMatchTarget;
  routeNameChainSeparator?: string;
};

export type RoutesLookupEntry = {
  nameChain: string;
  matched: RouteBaseInfo[];
};

export type RoutesLookupTable = Map<string, RoutesLookupEntry>;

export type RoutableRuntime = {
  config: RoutingConfig;
  routesLUT: RoutesLookupTable;
  routableObjects: Set<object>;
  lazyRoutableRegistry?: Array<any>;
  onLazyRoutableModuleLoaded?: (loadedModule: Record<string, any>) => void | Promise<void>;
};

export type RoutableClass<T extends object = any> = new (...args: any[]) => T;

export type RoutableFactory<T extends object = any> = () => T;

export type RoutableDefinition<T extends object = any> = {
  key: InjectionKey<T>;
  create: RoutableFactory<T>;
  label: string;
  source?: RoutableClass<T>;
};

export type RoutableRegistration<T extends object = any> =
  | RoutableClass<T>
  | RoutableDefinition<T>;

export type RoutableContainer = {
  runtime: RoutableRuntime;
  get<T extends object>(target: RoutableRegistration<T>): T;
  has<T extends object>(target: RoutableRegistration<T>): boolean;
  register(...targets: RoutableRegistration<any>[]): void;
};

export type CreateRoutableScopeOptions = {
  router: Router;
  routing?: Partial<RoutingConfig>;
  routables: RoutableRegistration<any>[];
};

export type GuardConfig = {
  priority: number;
  handler: MethodName;
};

export type RouteChangeHandler = (
  target: any,
  to?: RouteLocation,
  from?: RouteLocation
) => Promise<boolean | RouteRecordRaw>;

/**
 * Method signature for a route
 */
export type RouteResolver = (route: RouteLocation) => boolean;

export type RouteMatchTarget = 'name' | 'name-chain' | 'path' | string;

export type RouteMatchExpression = string | RegExp | RouteResolver;

export type RouteWatcherConfig = RequireAtLeastOneParameter<{
  priority?: number;
  match?: RouteMatchExpression | RouteMatchExpression[];
  on?: Array<RouteHandlerEventType> | RouteHandlerEventType;
}>;

export type RouteWatcherContext = RouteWatcherConfig & {
  handler: string;
  currentAction?: RouteHandlerEventType;
  target?: any;
};

export type RoutableConfig = {
  activeRoutes: RouteMatchExpression[];
  matchTarget?: RouteMatchTarget;
  routeMatcher?: RouteResolver;
  instanceRouteMatchers: WeakMap<any, RouteResolver>;
  activate?: RouteChangeHandlerConfig;
  deactivate?: RouteChangeHandlerConfig;
  update?: RouteChangeHandlerConfig;
  guardEnter?: GuardConfig;
  guardLeave?: GuardConfig;
  class?: string;
  watchers: Array<RouteWatcherContext>;
};

export type MetaDecoratorArgs =
  | string
  | RequireAtLeastOneParameter<{ path?: string; route?: 'from' | 'to' }>;
