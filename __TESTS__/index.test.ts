import createFakeRouter from './fake-router';
import { registerRouter, registerRoutableClasses } from '../src/index';
import { Router } from 'vue-router';
import annotatedController, {
  AnnotatedController,
} from './annotated-controller';
import sessionModel from './test-model';
import { AnotherAnnotatedController } from './another-annotated-controller';
registerRoutableClasses(AnnotatedController, AnotherAnnotatedController);

const router = createFakeRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      params : {},
      query : {},
      meta: {}
    },
    {
      name: 'auth-route',
      meta: {
        requiresAuth: true,
      },
      params : {},
      query : {}
    },
    {
      name: 'basic-route',
      params : {},
      query : {},
      meta: {}
    },
    {
      name: 'login-page',
      meta: {
        requiresAuth: false,
      },
      params : {},
      query : {}
    },
    {
      name: 'deep-parametrised',
      params: {
        param1: 'deep',
        param2: 'thought',
        meta: {}
      },
    },
  ],
} as any);

registerRouter(router as unknown as Router);

describe('Injection test', () => {
  try {
    test('test_basics', async () => {
      await router.push({ name: 'home' });
      await router.push({ name: 'basic-route' });
      expect(router.currentRoute.name).toBe('basic-route');
    });
    test('reject_unauthenticated', async () => {
      sessionModel.isAuthenticated = false;
      await router.push({ name: 'home' });
      await router.push({ name: 'auth-route' });
      expect(router.currentRoute.name).toBe('login-page');
    });
    test('accept_authenticated', async () => {
      sessionModel.isAuthenticated = true;
      await router.push({ name: 'home' });
      await router.push({ name: 'auth-route' });
      expect(router.currentRoute.name).toBe('auth-route');
    });
    test('route_handlerpriority_order', async () => {
      sessionModel.isAuthenticated = true;
      let email = '';
      const unsubscribe = annotatedController.subscribeToEmailEvents(
        (anEmail: string) => {
          email = anEmail;
        }
      );
      await router.push({ name: 'home' });
      await router.push({ name: 'auth-route' });
      unsubscribe();
      expect(email).toEqual('john.doe@email.com');
    });
    test('route_with_parameter_decorators', async () => {
      await router.push({ name: 'deep-parametrised' });
      expect(sessionModel.testData?.paramDecoratorValue).toEqual({
        param1: 'deep',
        param2: 'thought',
      });
    });
    test('accumulated_paths_from_watchers', async () => {
      await router.push({ name: 'deep-parametrised' });
      expect(sessionModel.testData?.paths).toEqual([
        '/basic-route',
        '/login-page'
      ]);
    })

  } catch (e) {
    console.error(e);
  }
});
