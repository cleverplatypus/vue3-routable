import { RouteLocation, RouteRecordRaw } from 'vue-router'

export type RouteResolver = (route: RouteLocation) => boolean

export type GuardConfig = { priority : Number, handler : (to: RouteLocation, from: RouteLocation) => Promise<RouteRecordRaw | boolean>};

export type RoutableConfig = {
    activeRoutes: Array<string | RegExp | RouteResolver>
    activate?: (to: RouteLocation, from: RouteLocation) => Promise<any>
    deactivate?: (to: RouteLocation, from: RouteLocation) => Promise<any>
    update?: (to: RouteLocation, from: RouteLocation) => Promise<any>
    guardEnter?: GuardConfig
    guardLeave?: GuardConfig
  }
  