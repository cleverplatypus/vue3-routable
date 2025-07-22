import { Routable, RouteActivated, RouteDeactivated } from "../src";

@Routable("/about")
export class TestControllerAbout {
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

export default new TestControllerAbout();
