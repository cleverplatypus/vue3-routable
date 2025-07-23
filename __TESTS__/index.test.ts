import { beforeAll, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { registerRouter, routableObjectIsActive } from '../src/index';
import TestComponent from './TestComponent.vue';
import testControllerAbout from './test-controller-about';
import testControllerDeep from './test-controller-deep';
import testControllerGuarded from './test-controller-guarded';
import testControllerParams from './test-controller-params';
import testControllerUpdatable from './test-controller-updatable';
import testControllerMeta from './test-controller-meta';
import { multipleA, multipleB } from './test-controller-multiple-instances';
import testControllerAboutPath from './test-controller-about-path';
import testControllerProduct from './test-controller-product';
import testControllerProductOptions from './test-controller-product-options';
import testControllerNameChain from './test-controller-name-chain';
import test from 'node:test';

const routes = [
  {
    path: '/',
    name: 'home',
    component: TestComponent,
  },
  {
    path: '/product/:id',
    name: 'product',
    component: TestComponent,
    children: [
      {
        path: 'options/:optionId',
        name: 'product-options',
        component: TestComponent,
      },
    ],
  },
  {
    path: '/multipleA',
    name: 'multipleA',
    component: TestComponent,
  },
  {
    path: '/multipleB',
    name: 'multipleB',
    component: TestComponent,
  },
  {
    path: '/redirect-destination',
    name: 'redirect-destination',
    component: TestComponent,
  },
  {
    path: '/addable',
    component: TestComponent,
    name: 'addable',
  },
  {
    path: '/guarded',
    component: TestComponent,
    name: 'guarded',
  },
  {
    path: '/about',
    name: 'about',
    component: TestComponent,
  },
  {
    path: '/params/:param1/:param2',
    name: 'params',
    meta: {
      meta1: 'meta1-value',
    },
    component: TestComponent,
  },
  {
    path: '/meta',
    name: 'meta',
    component: TestComponent,
    meta: {
      meta1: 'meta1-value',
    },
  },
  {
    path: '/meta1',
    name: 'meta1',
    component: TestComponent,
    meta: {
      meta2: 'meta2-value',
      meta3: 'meta3-value',
    },
  },
  {
    path: '/deep',
    name: 'deep',
    component: TestComponent,
    children: [
      {
        path: 'nested1',
        name: 'nested1',
        component: TestComponent,
      },
      {
        path: 'nested2',
        name: 'nested2',
        component: TestComponent,
        children: [
          {
            path: 'nested3',
            name: 'nested3',
            component: TestComponent,
          },
        ],
      },
    ],
  },
  {
    path: '/chain-deep',
    name: 'chain-deep',
    component: TestComponent,
    children: [
      {
        path: 'nested1',
        name: 'chain-nested1',
        component: TestComponent,
      },
      {
        path: 'nested2',
        name: 'chain-nested2',
        component: TestComponent,
        children: [
          {
            path: 'nested3',
            name: 'chain-nested3',
            component: TestComponent,
          },
        ],
      },
    ],
  },
];

describe.sequential('vue3-routable', () => {
  describe('route_name_matching', () => {
    let routeNameRouter;

    beforeAll(() => {
      routeNameRouter = registerRouter(
        createRouter({
          history: createMemoryHistory(),
          routes,
        })
      );
    });

    describe('basic_activation', () => {
      it('should_activate_controller_with_match_target_override', async () => {
        expect(testControllerAbout.isActive).toEqual(false);
        await routeNameRouter.push({ name: 'about' });
        expect(testControllerAbout.isActive).toEqual(true);
      });

      it('should_deactivate_controller', async () => {
        await routeNameRouter.push({ name: 'home' });
        expect(testControllerAbout.isActive).toEqual(false);
      });
    });

    describe('named_chain_activation', () => {
      it('should_activate_named_chain_controller', async () => {
        expect(testControllerNameChain.isActive).toEqual(false);
        await routeNameRouter.push({ name: 'chain-nested3' });
        expect(testControllerNameChain.isActive).toEqual(true);
      });

      it('should_deactivate_named_chain_controller', async () => {
        await routeNameRouter.push({ name: 'home' });
        expect(testControllerNameChain.isActive).toEqual(false);
      });
    });

    describe('redirected_activation', () => {
      it('should_redirect_upon_activation', async () => {
        await routeNameRouter.push({ name: 'home' });
        expect(testControllerAbout.isActive).toEqual(false);
        testControllerAbout.redirectOnEnter = { name: 'redirect-destination' };
        await routeNameRouter.push({ name: 'about' });
        expect(testControllerAbout.isActive).toEqual(false);
        expect(routeNameRouter.currentRoute.value.name).toEqual(
          'redirect-destination'
        );
        testControllerAbout.redirectOnEnter = null; //prevent further tests on 'about' from being redirected
      });
    });

    describe('routableObjectIsActive', () => {
      it('routableObjectIsActive_returns_true_when_object_active', async () => {
        let isActive = routableObjectIsActive(
          routeNameRouter.currentRoute.value,
          testControllerAbout
        );
        expect(isActive).toEqual(false);
        await routeNameRouter.push({ name: 'about' });
        isActive = routableObjectIsActive(
          routeNameRouter.currentRoute.value,
          testControllerAbout
        );
        expect(isActive).toEqual(true);
      });

      it('routableObjectIsActive_returns_false_when_object_inactive', async () => {
        await routeNameRouter.push({ name: 'home' });
        expect(
          routableObjectIsActive(
            routeNameRouter.currentRoute.value,
            testControllerAbout
          )
        ).toEqual(false);
      });
    });

    describe('route_updates', () => {
      it('should_increment_updates_without_triggering_activation', async () => {
        await routeNameRouter.push({
          name: 'addable',
        });
        expect(testControllerUpdatable.activationHitCount).toEqual(1);
        expect(testControllerUpdatable.updatesAccumulator).toEqual(0);
        await routeNameRouter.push({
          query: {
            addable: 2,
          },
        });

        expect(testControllerUpdatable.activationHitCount).toEqual(1);
        expect(testControllerUpdatable.updatesAccumulator).toEqual(2);

        await routeNameRouter.push({
          query: {
            addable: 3,
          },
        });

        expect(testControllerUpdatable.activationHitCount).toEqual(1);
        expect(testControllerUpdatable.updatesAccumulator).toEqual(5);
      });
    });

    describe('nested_routes_and_watcher', () => {
      it('route_activated_only_on_exact_hit', async () => {
        
        expect(testControllerDeep.activationHitsCount).toEqual(0);
        await routeNameRouter.push({
          name: 'deep',
        });

        expect(testControllerDeep.activationHitsCount).toEqual(1);

        await routeNameRouter.push({
          name: 'nested1',
        });
        expect(testControllerDeep.activationHitsCount).toEqual(1);
        await routeNameRouter.push({
          name: 'nested2',
        });
        expect(testControllerDeep.activationHitsCount).toEqual(1);
        await routeNameRouter.push({
          name: 'nested3',
        });
        expect(testControllerDeep.activationHitsCount).toEqual(1);
        expect(testControllerDeep.deactivationHitsCount).toEqual(0);
        expect(testControllerDeep.routesHitCount).toEqual(4);
        await routeNameRouter.push({
          name: 'home',
        });
        expect(testControllerDeep.deactivationHitsCount).toEqual(1);
        expect(testControllerDeep.routesHitCount).toEqual(5); //watcher will be hit because `from` will match the routable object config
        await routeNameRouter.push({
          name: 'about',
        });
        expect(testControllerDeep.routesHitCount).toEqual(5);
      });
    });

    describe('annotated_methods_annotated_params', () => {
      it('activated_params_expected_values', async () => {
        await routeNameRouter.push('/');
        testControllerParams.passedParams = null;
        await routeNameRouter.push({
          name: 'params',
          params: {
            param1: 'param1-value',
            param2: 'param2-value',
          },
        });
        expect(testControllerParams.passedParams).toEqual({
          param1: 'param1-value',
          param2: 'param2-value',
          meta1: 'meta1-value',
          to: 'params',
          from: 'home',
        });
      });

      it('updated_params_expected_values', async () => {
        testControllerParams.passedParams = null;
        await routeNameRouter.push('/');
        await routeNameRouter.push({
          name: 'params',
          params: {
            param1: 'param1-value',
            param2: 'param2-value',
          },
        });
        await routeNameRouter.push({
          query: { query1: 'query1-value' },
          params: {
            param1: 'updated-param1-value',
            param2: 'updated-param2-value',
          },
        });
        expect(testControllerParams.passedParams).toEqual({
          param1: 'updated-param1-value',
          param2: 'updated-param2-value',
          meta1: 'meta1-value',
          to: 'params',
          from: 'params',
          query1: 'query1-value',
        });
      });

      it('watcher_params_expected_values', async () => {
        testControllerParams.passedParams = null;
        await routeNameRouter.push('/');

        await routeNameRouter.push({
          name: 'params',
          params: {
            param1: 'param1-value',
            param2: 'param2-value',
          },
        });

        await routeNameRouter.push({
          name: 'home',
          query: {
            query1: 'home-query1-value',
          },
        });

        expect(testControllerParams.passedParams).toEqual({
          to: 'home',
          from: 'params',
          query1: 'home-query1-value',
        });
      });
    });

    describe('route_guards', () => {
      it('route_enter_guard', async () => {
        await routeNameRouter.push('/');
        expect(testControllerGuarded.isActive).toEqual(false);
        testControllerGuarded.shouldEnter = false;
        await routeNameRouter.push({
          name: 'guarded',
        });
        expect(testControllerGuarded.isActive).toEqual(false);
        testControllerGuarded.shouldEnter = true;
        await routeNameRouter.push({
          name: 'guarded',
        });
        expect(testControllerGuarded.isActive).toEqual(true);
      });

      it('route_exit_guard', async () => {
        testControllerGuarded.shouldEnter = true;
        await routeNameRouter.push({
          name: 'guarded',
        });
        expect(testControllerGuarded.isActive).toEqual(true);
        testControllerGuarded.shouldExit = false;
        await routeNameRouter.push({
          name: 'home',
        });
        expect(testControllerGuarded.isActive).toEqual(true);
        testControllerGuarded.shouldExit = true;
        await routeNameRouter.push({
          name: 'home',
        });
        expect(testControllerGuarded.isActive).toEqual(false);
      });

      it('route_enter_guard_redirect', async () => {
        await routeNameRouter.push('/');
        expect(testControllerGuarded.isActive).toEqual(false);
        testControllerGuarded.redirectOnEnter = {
          name: 'redirect-destination',
        };
        await routeNameRouter.push({
          name: 'guarded',
        });
        expect(routeNameRouter.currentRoute.value.name).toEqual(
          'redirect-destination'
        );
      });
    });

    describe('meta_param_decorator', () => {
      it('route_meta_polymorphic_configuration', async () => {
        await routeNameRouter.push('/');
        expect(testControllerMeta.gatheredMeta).toEqual([]);
        await routeNameRouter.push({ name: 'meta' });
        expect(testControllerMeta.gatheredMeta).toEqual([
          'meta1-value',
          null,
          null,
        ]);
        testControllerMeta.gatheredMeta.length = 0;
        await routeNameRouter.push({ name: 'meta1' });
        expect(testControllerMeta.gatheredMeta).toEqual([
          null,
          null,
          'meta3-value',
        ]);
        testControllerMeta.gatheredMeta.length = 0;
        await routeNameRouter.push({ name: 'meta' });
        expect(testControllerMeta.gatheredMeta).toEqual([
          'meta1-value',
          'meta2-value',
          null,
        ]);
      });
    });

    describe('instance_route_matching', () => {
      it('activates_deactivates_route_matcher_instances', async () => {
        await routeNameRouter.push('/');
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleA)
        ).toEqual(false);
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleB)
        ).toEqual(false);
        expect(multipleA.isActive).toEqual(false);
        expect(multipleB.isActive).toEqual(false);

        await routeNameRouter.push({ name: 'multipleA' });
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleA)
        ).toEqual(true);
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleB)
        ).toEqual(false);
        expect(multipleA.isActive).toEqual(true);
        expect(multipleB.isActive).toEqual(false);

        await routeNameRouter.push({ name: 'multipleB' });
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleA)
        ).toEqual(false);
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleB)
        ).toEqual(true);
        expect(multipleA.isActive).toEqual(false);
        expect(multipleB.isActive).toEqual(true);

        await routeNameRouter.push('/');
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleA)
        ).toEqual(false);
        expect(
          routableObjectIsActive(routeNameRouter.currentRoute.value, multipleB)
        ).toEqual(false);
        expect(multipleA.isActive).toEqual(false);
        expect(multipleB.isActive).toEqual(false);
      });
    });
  });

  describe('route_path_matching', () => {
    let routePathRouter;
    beforeAll(() => {
      routePathRouter = registerRouter(
        createRouter({
          history: createMemoryHistory(),
          routes,
        }),
        { defaultMatchTarget: 'path' }
      );
    });

    describe('path_matching_router', () => {
      it('should_activate_simple_path_match', async () => {
        await routePathRouter.push({ path: '/about' });
        expect(testControllerAboutPath.isActive).toEqual(true);
        await routePathRouter.push({ path: '/' });
        expect(testControllerAboutPath.isActive).toEqual(false);
      });

      it('should_activate_path_with_params', async () => {
        await routePathRouter.push({ path: '/product/123' });
        expect(testControllerProduct.isActive).toEqual(true);
        expect(testControllerProduct.productId).toEqual('123');
      });
      it('should_activate_path_with_nested_params', async () => {
        await routePathRouter.push({ path: '/product/123/options/456' });
        expect(testControllerProductOptions.isActive).toEqual(true);
        expect(testControllerProductOptions.productId).toEqual('123');
        expect(testControllerProductOptions.optionId).toEqual('456');
      });
    });
  });
});
