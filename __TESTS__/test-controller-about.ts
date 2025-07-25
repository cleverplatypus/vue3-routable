import { Routable, RouteActivated, RouteDeactivated } from "../src";

@Routable("/about", 'path')
export class TestControllerAbout {
  isActive = false;
  redirectOnEnter: null | { name: string } = null;

  @RouteActivated()
  onRouteActivated() {
    if (this.redirectOnEnter) return this.redirectOnEnter;
    this.isActive = true;
  }

  @RouteDeactivated()
  onRouteDeactivated() {
    this.isActive = false;
  }
}

export default new TestControllerAbout();
