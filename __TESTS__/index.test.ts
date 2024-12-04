import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import {
  registerRouter,
  routableObjectIsActive
} from "../src/index";
import TestComponent from "./TestComponent.vue";
import testControllerAbout from "./test-controller-about";
import testControllerDeep from "./test-controller-deep";
import testControllerGuarded from "./test-controller-guarded";
import testControllerParams from "./test-controller-params";
import testControllerUpdatable from "./test-controller-updatable";

const routes = [
  {
    path: "/",
    name: "home",
    component: TestComponent,
  },
  {
    path: '/redirect-destination',
    name: 'redirect-destination',
    component: TestComponent
  },
  {
    path: "/addable",
    component: TestComponent,
    name: "addable",
  },
  {
    path: "/guarded",
    component: TestComponent,
    name: "guarded",
  },
  {
    path: "/about",
    name: "about",
    component: TestComponent,
  },
  {
    path: "/params/:param1/:param2",
    name: "params",
    meta: {
      meta1: "meta1-value",
    },
    component: TestComponent,
  },
  {
    path: "/deep",
    name: "deep",
    component: TestComponent,
    children: [
      {
        path: "nested1",
        name: "nested1",
        component: TestComponent,
      },
      {
        path: "nested2",
        name: "nested2",
        component: TestComponent,
        children: [
          {
            path: "nested3",
            name: "nested3",
            component: TestComponent,
          },
        ],
      },
    ],
  },
];
const router = registerRouter(
  createRouter({
    history: createMemoryHistory(),
    routes,
  })
);

describe("basic_activation", () => {
  it("should_activate_controller", async () => {
    expect(testControllerAbout.isActive).toEqual(false);
    await router.push({ name: "about" });
    expect(testControllerAbout.isActive).toEqual(true);
  });

  it("should_deactivate_controller", async () => {
    await router.push({ name: "home" });
    expect(testControllerAbout.isActive).toEqual(false);
  });
});

describe("redirected_activation", () => {
  it("should_redirect_upon_activation", async () => {
    await router.push({ name: "home" });
    expect(testControllerAbout.isActive).toEqual(false);
    testControllerAbout.redirectOnEnter = { name : 'redirect-destination'}
    await router.push({ name: "about" });
    expect(testControllerAbout.isActive).toEqual(false);
    expect(router.currentRoute.value.name).toEqual('redirect-destination');
    testControllerAbout.redirectOnEnter = null; //prevent further tests on 'about' from being redirected
  });

});

describe("routableObjectIsActive", () => {
  it("routableObjectIsActive_returns_true_when_object_active", async () => {
    let isActive = routableObjectIsActive(
      router.currentRoute.value,
      testControllerAbout
    );
    expect(isActive).toEqual(false);
    await router.push({ name: "about" });
    isActive = routableObjectIsActive(
      router.currentRoute.value,
      testControllerAbout
    );
    expect(isActive).toEqual(true);
  });

  it("routableObjectIsActive_returns_false_when_object_inactive", async () => {
    await router.push({ name: "home" });
    expect(
      routableObjectIsActive(router.currentRoute.value, testControllerAbout)
    ).toEqual(false);
  });
});

describe("route_updates", () => {
  it("should_increment_updates_without_triggering_activation", async () => {
    await router.push({
      name: "addable",
    });
    expect(testControllerUpdatable.activationHitCount).toEqual(1);
    expect(testControllerUpdatable.updatesAccumulator).toEqual(0);
    await router.push({
      query: {
        addable: 2,
      },
    });

    expect(testControllerUpdatable.activationHitCount).toEqual(1);
    expect(testControllerUpdatable.updatesAccumulator).toEqual(2);

    await router.push({
      query: {
        addable: 3,
      },
    });

    expect(testControllerUpdatable.activationHitCount).toEqual(1);
    expect(testControllerUpdatable.updatesAccumulator).toEqual(5);
  });
});

describe("nested_routes_and_watcher", () => {
  it("route_activated_only_on_exact_hit", async () => {
    expect(testControllerDeep.activationHitsCount).toEqual(0);
    await router.push({
      name: "deep",
    });

    expect(testControllerDeep.activationHitsCount).toEqual(1);

    await router.push({
      name: "nested1",
    });
    expect(testControllerDeep.activationHitsCount).toEqual(1);
    await router.push({
      name: "nested2",
    });
    expect(testControllerDeep.activationHitsCount).toEqual(1);
    await router.push({
      name: "nested3",
    });
    expect(testControllerDeep.activationHitsCount).toEqual(1);
    expect(testControllerDeep.deactivationHitsCount).toEqual(0);
    expect(testControllerDeep.routesHitCount).toEqual(4);
    await router.push({
      name: "home",
    });
    expect(testControllerDeep.deactivationHitsCount).toEqual(1);
    expect(testControllerDeep.routesHitCount).toEqual(5); //watcher will be hit because `from` will match the routable object config
    await router.push({
      name: "about",
    });
    expect(testControllerDeep.routesHitCount).toEqual(5);
  });
});

describe("annotated_methods_annotated_params", () => {
  it("activated_params_expected_values", async () => {
    await router.push("/");
    testControllerParams.passedParams = null;
    await router.push({
      name: "params",
      params: {
        param1: "param1-value",
        param2: "param2-value",
      },
    });
    expect(testControllerParams.passedParams).toEqual({
      param1: "param1-value",
      param2: "param2-value",
      meta1: "meta1-value",
      to: "params",
      from: "home",
    });
  });

  it("updated_params_expected_values", async () => {
    testControllerParams.passedParams = null;
    await router.push("/");
    await router.push({
      name: "params",
      params: {
        param1: "param1-value",
        param2: "param2-value",
      },
    });
    await router.push({
      query: { query1: "query1-value" },
      params: {
        param1: "updated-param1-value",
        param2: "updated-param2-value",
      },
    });
    expect(testControllerParams.passedParams).toEqual({
      param1: "updated-param1-value",
      param2: "updated-param2-value",
      meta1: "meta1-value",
      to: "params",
      from: "params",
      query1: "query1-value",
    });
  });

  it("watcher_params_expected_values", async () => {
    testControllerParams.passedParams = null;
    await router.push("/");

    await router.push({
      name: "params",
      params: {
        param1: "param1-value",
        param2: "param2-value",
      },
    });

    await router.push({
      name: "home",
      query: {
        query1: "home-query1-value",
      },
    });

    expect(testControllerParams.passedParams).toEqual({
      to: "home",
      from: "params",
      query1: "home-query1-value",
    });
  });
});

describe('route_guards', () => {
  it('route_enter_guard', async () => {
    await router.push('/');
    expect(testControllerGuarded.isActive).toEqual(false);
    testControllerGuarded.shouldEnter = false;
    await router.push({
      name : 'guarded'
    });
    expect(testControllerGuarded.isActive).toEqual(false);
    testControllerGuarded.shouldEnter = true;
    await router.push({
      name : 'guarded'
    });
    expect(testControllerGuarded.isActive).toEqual(true);
  })

  it('route_exit_guard', async () => {
    testControllerGuarded.shouldEnter = true;
    await router.push({
      name : 'guarded'
    });
    expect(testControllerGuarded.isActive).toEqual(true);
    testControllerGuarded.shouldExit = false;
    await router.push({
      name : 'home'
    });
    expect(testControllerGuarded.isActive).toEqual(true);
    testControllerGuarded.shouldExit = true;
    await router.push({
      name : 'home'
    });
    expect(testControllerGuarded.isActive).toEqual(false);
  })

  it('route_enter_guard_redirect', async () => {
    await router.push('/');
    expect(testControllerGuarded.isActive).toEqual(false);
    testControllerGuarded.redirectOnEnter = {name : 'redirect-destination'};
    await router.push({
      name : 'guarded'
    });
    expect(router.currentRoute.value.name).toEqual('redirect-destination');
  })

})