import {
  Param,
  Query,
  Routable,
  RouteActivated,
  RouteDeactivated,
  RouteUpdated,
} from "../src";

@Routable("addable")
export class TestControllerUpdatable {
  activationHitCount = 0;
  updatesAccumulator = 0;
  @RouteActivated()
  onRouteActivated() {
    this.activationHitCount++;
  }

  @RouteUpdated()
  onRouteUpdated(@Query("addable") addable: string) {
    this.updatesAccumulator += parseInt(addable || "0");
  }
}

export default new TestControllerUpdatable();
