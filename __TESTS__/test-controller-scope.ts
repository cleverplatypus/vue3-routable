import { RouteActivated, RouteDeactivated, Routable } from '../src';

@Routable('about')
export class ScopedController {
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

@Routable('about')
export class FactoryController {
  constructor(public readonly label: string) {}
}

@Routable('about')
export class LazyScopedController {
  isActive = false;

  @RouteActivated()
  onRouteActivated() {
    this.isActive = true;
  }
}