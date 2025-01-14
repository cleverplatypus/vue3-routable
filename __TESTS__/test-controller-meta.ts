import { Meta, Routable, RouteActivated, RouteDeactivated, RouteWatcher } from "../src";

@Routable(/meta/)
export class TestControllerAbout {

  gatheredMeta : Array<string|null> = []

  @RouteWatcher()
  routeWatch(
    @Meta('meta1') meta1 : string, 
    @Meta({route : 'from'}) fromMeta : Record<string, any>,
    @Meta() toMeta : Record<string, any>
    ) {
    this.gatheredMeta.push(meta1 || null, fromMeta.meta2 || null, toMeta.meta3 || null);
  }
}

export default new TestControllerAbout();
