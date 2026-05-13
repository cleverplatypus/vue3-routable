import { mount } from '@vue/test-utils';
import { defineComponent, h, inject } from 'vue';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createRoutableScope, defineRoutable, useRoutable } from '../src';
import {
  FactoryController,
  LazyScopedController,
  ScopedController,
} from './test-controller-scope';

const TestComponent = defineComponent({
  name: 'ScopedTestComponent',
  render() {
    return h('div');
  },
});

const routes = [
  {
    path: '/',
    name: 'home',
    component: TestComponent,
  },
  {
    path: '/about',
    name: 'about',
    component: TestComponent,
  },
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes,
  });
}

describe.sequential('routable_scopes', () => {
  it('isolates_controller_instances_per_scope', async () => {
    const routerA = createTestRouter();
    const routerB = createTestRouter();
    const scopeA = createRoutableScope({
      router: routerA,
      routables: [ScopedController],
    });
    const scopeB = createRoutableScope({
      router: routerB,
      routables: [ScopedController],
    });

    const controllerA = scopeA.get(ScopedController);
    const controllerB = scopeB.get(ScopedController);

    expect(controllerA).not.toBe(controllerB);
    expect(controllerA.isActive).toEqual(false);
    expect(controllerB.isActive).toEqual(false);

    await routerA.push({ name: 'about' });
    expect(controllerA.isActive).toEqual(true);
    expect(controllerB.isActive).toEqual(false);

    await routerB.push({ name: 'about' });
    expect(controllerA.isActive).toEqual(true);
    expect(controllerB.isActive).toEqual(true);

    await routerA.push({ name: 'home' });
    expect(controllerA.isActive).toEqual(false);
    expect(controllerB.isActive).toEqual(true);
  });

  it('resolves_direct_class_registrations_through_use_routable', () => {
    const scope = createRoutableScope({
      router: createTestRouter(),
      routables: [ScopedController],
    });

    const ProbeComponent = defineComponent({
      name: 'DirectClassProbe',
      setup() {
        return {
          controller: useRoutable(ScopedController),
        };
      },
      render() {
        return h('div');
      },
    });

    const wrapper = mount(ProbeComponent, {
      global: {
        plugins: [scope],
      },
    });

    expect((wrapper.vm as any).controller).toBe(scope.get(ScopedController));
  });

  it('provides_explicit_factory_registrations_through_inject', () => {
    const factoryRegistration = defineRoutable(
      'factory-controller',
      () => new FactoryController('scoped')
    );
    const scope = createRoutableScope({
      router: createTestRouter(),
      routables: [factoryRegistration],
    });

    const ProbeComponent = defineComponent({
      name: 'FactoryProbe',
      setup() {
        return {
          fromUseRoutable: useRoutable(factoryRegistration),
          fromInject: inject(factoryRegistration.key),
        };
      },
      render() {
        return h('div');
      },
    });

    const wrapper = mount(ProbeComponent, {
      global: {
        plugins: [scope],
      },
    });

    expect(scope.get(factoryRegistration).label).toEqual('scoped');
    expect((wrapper.vm as any).fromUseRoutable).toBe(
      scope.get(factoryRegistration)
    );
    expect((wrapper.vm as any).fromInject).toBe(scope.get(factoryRegistration));
  });

  it('registers_lazy_loaded_routable_exports_into_scope', async () => {
    const lazyRegistration = defineRoutable(
      'lazy-scoped-controller',
      () => new LazyScopedController()
    );
    const router = createTestRouter();
    const scope = createRoutableScope({
      router,
      routables: [],
    });

    scope.runtime.lazyRoutableRegistry = [
      {
        match: ['about'],
        loaded: false,
        loader: async () => ({ lazyRegistration }),
      },
    ];

    expect(scope.has(lazyRegistration)).toEqual(false);

    await router.push({ name: 'about' });

    expect(scope.has(lazyRegistration)).toEqual(true);
    expect(scope.get(lazyRegistration).isActive).toEqual(true);
  });

  it('registers_lazy_loaded_routable_classes_into_scope', async () => {
    const router = createTestRouter();
    const scope = createRoutableScope({
      router,
      routables: [],
    });

    scope.runtime.lazyRoutableRegistry = [
      {
        match: ['about'],
        loaded: false,
        loader: async () => ({ LazyScopedController }),
      },
    ];

    expect(scope.has(LazyScopedController)).toEqual(false);

    await router.push({ name: 'about' });

    expect(scope.has(LazyScopedController)).toEqual(true);
    expect(scope.get(LazyScopedController).isActive).toEqual(true);
  });
});