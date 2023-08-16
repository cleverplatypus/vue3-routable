import type { RouteLocation, RouteRecordRaw } from 'vue-router';
import {TO_METADATA, PARAM_METADATA, QUERY_METADATA, META_METADATA, FROM_METADATA, HANDLER_ARGS_METADATA} from './symbols';

export type MethodName = string;

export type RouteChangeHandlerConfig = {
  handler: MethodName;
  priority: number;
  class?:string;
};

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

export type RoutableConfig = {
  activeRoutes: Array<string | RegExp | RouteResolver>;
  activate?: RouteChangeHandlerConfig;
  deactivate?: RouteChangeHandlerConfig;
  update?: RouteChangeHandlerConfig;
  guardEnter?: GuardConfig;
  guardLeave?: GuardConfig;
  class? : string;
};
