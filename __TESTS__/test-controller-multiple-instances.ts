import { RouteLocation } from "vue-router";
import {
  Routable,
  RouteActivated,
  RouteDeactivated,
  RouteMatcher,
  To,
} from "../src";

@Routable()
export class TestControllerMultipleInstances {
  private activeRoute;
  private _isActive = false;

  constructor(activeRoute: string) {
    this.activeRoute = activeRoute;
  }

  get isActive() {
    return this._isActive;
  }

  @RouteMatcher()
  matchRoute(route: RouteLocation) {
    return route.name === this.activeRoute;
  }

  @RouteActivated()
  onRouteActivated(@To("name") routeName: string) {
    this._isActive = true;
  }

  @RouteDeactivated()
  onRouteDeactivated() {
    this._isActive = false;
  }
}

export const multipleA = new TestControllerMultipleInstances("multipleA");
export const multipleB = new TestControllerMultipleInstances("multipleB");
