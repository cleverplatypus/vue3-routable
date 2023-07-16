import createFakeRouter from './fake-router';
import { registerRouter, registerRoutableClasses } from '../src/index';
import { Router } from 'vue-router';
import annotatedController, { AnnotatedController } from './annotated-controller';
import sessionModel from './session-model';
import { AnotherAnnotatedController } from './another-annotated-controller';
registerRoutableClasses(AnnotatedController, AnotherAnnotatedController);


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
      const unsubscribe = annotatedController.subscribeToEmailEvents((anEmail:string) => {
        email = anEmail;
      })
      await router.push({ name: 'home' });
      await router.push({ name: 'auth-route' });
      unsubscribe();
      expect(email).toEqual('john.doe@email.com')
    });
    test('catch_al_route', () => {
      //write test
      
    })
  } catch (e) {
    console.error(e);
  }
});
