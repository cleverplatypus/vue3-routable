import type { RouteLocation, RouteRecordRaw } from 'vue-router';
import {TO_METADATA, PARAM_METADATA, QUERY_METADATA, META_METADATA, FROM_METADATA, HANDLER_ARGS_METADATA} from './symbols';
import { qualifiedTypeIdentifier } from '@babel/types';

export type MethodName = string;

export type RouteHandlerEventType = 'enter' | 'leave' | 'update';

export type RouteChangeHandlerConfig = {
  handler: MethodName;
  priority: number;
  class?:string;
};

export type RouteBaseInfo = {
  name : string
  path : string
  meta? : Record<string, any>
}

export type ParamMetadataType = typeof TO_METADATA | 
typeof PARAM_METADATA | 
typeof QUERY_METADATA | 
typeof META_METADATA |
typeof FROM_METADATA

export type MetadataType = typeof HANDLER_ARGS_METADATA;

export type HandlerParamMetadata = {
  type : ParamMetadataType
  args : Array<any>
}
export type RoutingConfig = {
  defaultMatchTarget : RouteMatchTarget,
  routeNameChainSeparator : string
}

export type GuardConfig = {
  priority: number;
  handler: MethodName
};

export type RouteChangeHandler = (
  target : any,
  to?: RouteLocation,
  from?: RouteLocation
) => Promise<boolean | RouteRecordRaw>;

export type RouteResolver = (route: RouteLocation) => boolean;

export type RouteMatchTarget = 'name' | 'name-chain' | 'path' | string

export type QualifiedMatchExpression<T> = {
  target? : RouteMatchTarget
  strict? : boolean
  expression : T
}

export type RouteMatchExpression = 
  QualifiedMatchExpression<string|RegExp> | string | RegExp | RouteResolver

export type RouteWatcherConfig = {
  priority?: number;
  match?: RouteMatchExpression | RouteMatchExpression [];
  on? : Array<RouteHandlerEventType> | RouteHandlerEventType;
}

export type RouteWatcherContext = RouteWatcherConfig & {
  handler: string
  currentAction? : RouteHandlerEventType
  target? : any
}

export type RoutableConfig = {
  activeRoutes: RouteMatchExpression[];
  activate?: RouteChangeHandlerConfig;
  deactivate?: RouteChangeHandlerConfig;
  update?: RouteChangeHandlerConfig;
  guardEnter?: GuardConfig;
  guardLeave?: GuardConfig;
  class? : string;
  watchers: Array<RouteWatcherContext>;
};
