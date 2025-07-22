import { Param, Routable, RouteActivated, RouteDeactivated } from "../src";

@Routable("/product/:id/options/:optionId")
export class TestControllerProduct {
  isActive = false;
  productId: string | null = null;
  optionId: string | null = null;

  @RouteActivated()
  onRouteActivated(
    @Param("id") productId: string,
    @Param("optionId") optionId: string
  ) {
    this.productId = productId;
    this.optionId = optionId;
    this.isActive = true;
  }
}

export default new TestControllerProduct();
