import { Routable, RouteActivated, RouteDeactivated, RouteWatcher, To } from "../src";

@Routable("deep")
export class TestControllerDeep {
  activationHitsCount = 0;
  deactivationHitsCount = 0;
  routesHitCount = 0;
  @RouteActivated()
  onRouteActivated() {
    this.activationHitsCount ++;
  }

  @RouteWatcher({on : 'enter'})
  watchRouteEnter() {
    this.routesHitCount++;
  }

  @RouteDeactivated()
  onRouteDeactivated() {
    this.deactivationHitsCount++;
  }
}

export default new TestControllerDeep();
