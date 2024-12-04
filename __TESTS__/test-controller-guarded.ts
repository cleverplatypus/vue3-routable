import {
  GuardRouteEnter,
  GuardRouteLeave,
  Query,
  Routable,
  RouteActivated,
  RouteDeactivated,
} from "../src";

@Routable("guarded")
export class TestControllerGuarded {
  isActive = false;
  shouldEnter = false;
  shouldExit = false;
  redirectOnEnter : null | {name : string} = null;

  @GuardRouteEnter()
  routeEnterGuard() {
    if (!this.shouldEnter) return false;
    if(this.redirectOnEnter) return this.redirectOnEnter;
    this.isActive = true;
  }

  @GuardRouteLeave()
  routeExitGuard() {
    if (!this.shouldExit) return false;
    this.isActive = false;
  }
}

export default new TestControllerGuarded();
