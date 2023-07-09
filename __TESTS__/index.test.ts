import createFakeRouter from './fake-router';
import { registerRouter, registerRoutableClasses } from '../src/index';
import { Router } from 'vue-router';
import{ AnnotatedController } from './annotated-controller';
import sessionModel from './session-model';
registerRoutableClasses(AnnotatedController);


const router = createFakeRouter({
  routes: [
    {
      path: '/',
      name: 'home',
    },
    {
      name: 'auth-route',
      meta : {
        requiresAuth : true
      }
    },
    {
      name: 'basic-route',
    },
    {
      name: 'login-page',
    }
  ]
} as any);

registerRouter(router as unknown as Router);

describe('Injection test', () => {
  try {
    test('test_basics', async () => {
      await router.push({ name: 'basic-route' });
      expect(router.currentRoute.name).toBe('basic-route');
    });
    test('reject_unauthenticated', async () => {
      sessionModel.isAuthenticated = false;
      await router.push({ name: 'auth-route' });
      expect(router.currentRoute.name).toBe('login-page');
    });
    test('accept_authenticated', async () => {
      sessionModel.isAuthenticated = true;
      await router.push({ name: 'auth-route' });
      expect(router.currentRoute.name).toBe('auth-route');
    });
  } catch (e) {
    console.error(e);
  }
});
