import {
  From,
  Meta,
  Param,
  Query,
  Routable,
  RouteActivated,
  RouteDeactivated,
  RouteUpdated,
  RouteWatcher,
  To,
} from "../src";

@Routable("params")
export class TestControllerAbout {
  passedParams: any = null;
  @RouteActivated()
  onRouteActivated(
    @Param("param1") param1: string,
    @Param("param2") param2: string,
    @Query("query1") query1: string,
    @Meta("meta1") meta1: string,
    @To("name") to: string,
    @From("name") from: string
  ) {
    this.passedParams = {
      param1,
      param2,
      query1,
      meta1,
      to,
      from,
    };
  }

  @RouteUpdated()
  onRouteUpdated(
    @Query("query1") query1: string,
    @Param("param1") param1: string,
    @Param("param2") param2: string,
    @To("name") to: string,
    @From("name") from: string
  ) {
    Object.assign(this.passedParams, { query1, to, from, param1, param2 });
  }

  @RouteWatcher({ on: "leave" })
  watchLeave(
    @Query("query1") query1: string,
    @Param("param1") param1: string,
    @Param("param2") param2: string,
    @To("name") to: string,
    @From("name") from: string
  ) {
    if(to === 'home')
        this.passedParams ={ query1, to, from, param1, param2 };
  }
}

export default new TestControllerAbout();
