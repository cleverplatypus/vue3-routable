import { describe, it, expect } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import TestComponent from "./TestComponent.vue";
import {
  registerRouter,
  registerRoutableClasses,
  routableObjectIsActive,
} from "../src/index";
import testControllerAbout, {
  TestControllerAbout,
} from "./test-controller-about";

registerRoutableClasses(TestControllerAbout);

const routes = [
  {
    path: "/",
    name: "home",
    component: TestComponent,
  },
  {
    path: "/about",
    name: "about",
    component: TestComponent,
    children: [
      {
        path: "nested1",
        name: "nested1",
        component: TestComponent,
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

describe("routableObjectIsActive", () => {
  it("should_activate_controller", async () => {
    let isActive = routableObjectIsActive(router.currentRoute.value, testControllerAbout);
    expect(isActive).toEqual(false);
    await router.push({ name: "about" });
    isActive = routableObjectIsActive(router.currentRoute.value, testControllerAbout);
    expect(isActive).toEqual(true);
  });

  it("should_deactivate_controller", async () => {
    await router.push({ name: "home" });
    expect(
      routableObjectIsActive(router.currentRoute.value, testControllerAbout)
    ).toEqual(false);
  });
});
