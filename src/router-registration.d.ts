import type { Router } from 'vue-router';
import type { RoutableRuntime, RoutingConfig } from './types';
export declare function bindRouterToRoutableRuntime(router: Router, runtime: RoutableRuntime, options?: Partial<RoutingConfig>): Router;
