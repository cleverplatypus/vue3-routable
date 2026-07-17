import {
  Routable,
  RouteActivated,
  HandlerInfo,
  type RoutableHandlerInfo,
} from '../src';

@Routable('runtime-browser')
export class BrowserOnlyController {
  activationHitCount = 0;
  seenRuntime: RoutableHandlerInfo['runtime'] | null = null;

  @RouteActivated({ runtime: 'browser' })
  onRouteActivated(@HandlerInfo() handler: RoutableHandlerInfo) {
    this.activationHitCount += 1;
    this.seenRuntime = handler.runtime;
  }
}

@Routable('runtime-ssr')
export class SsrOnlyController {
  activationHitCount = 0;

  @RouteActivated({ runtime: 'ssr' })
  onRouteActivated() {
    this.activationHitCount += 1;
  }
}

@Routable('cancel-once')
export class CancelOnFirstActivationController {
  activationHitCount = 0;
  seenRuntime: RoutableHandlerInfo['runtime'] | null = null;

  @RouteActivated()
  onRouteActivated(@HandlerInfo() handler: RoutableHandlerInfo) {
    this.activationHitCount += 1;
    this.seenRuntime = handler.runtime;
    handler.detach();
  }
}

export const browserOnlyController = new BrowserOnlyController();
export const ssrOnlyController = new SsrOnlyController();
export const cancelOnFirstActivationController =
  new CancelOnFirstActivationController();