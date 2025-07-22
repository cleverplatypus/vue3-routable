import { Param, Routable, RouteActivated, RouteDeactivated } from "../src";

@Routable("/product/:id")
export class TestControllerProduct {
  isActive = false;
  productId: string | null = null;

  @RouteActivated()
  onRouteActivated(@Param("id") productId: string) {
    this.productId = productId;
    this.isActive = true;
  }
}

export default new TestControllerProduct();
