import { RouteLocation, RouteRecordRaw } from 'vue-router';

export type RouteChangeHandlerConfig = {
  handler: RouteChangeHandler;
  priority: number;
  class?:string;
};

export type GuardConfig = {
  priority: number;
  handler: RouteChangeHandler
};

export type RouteChangeHandler = (
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
