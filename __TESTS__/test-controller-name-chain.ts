import { Routable, RouteActivated, RouteDeactivated } from "../src";

@Routable("deep.nested2.nested3", 'name-chain')
export class TestControllerNamedChain {
  isActive = false;

  @RouteActivated()
  onRouteActivated() {
    this.isActive = true;
  }

  @RouteDeactivated()
  onRouteDeactivated() {
    this.isActive = false;
  }
}

export default new TestControllerNamedChain();
