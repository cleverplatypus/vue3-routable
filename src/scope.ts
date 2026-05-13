import { inject, type App, type InjectionKey, type Plugin } from 'vue';
import { hasRegisteredClass, withRoutableObjectRegistry } from './registry';
import { bindRouterToRoutableRuntime } from './router-registration';
import { createRoutableRuntime } from './runtime';
import type {
  CreateRoutableScopeOptions,
  RoutableClass,
  RoutableContainer,
  RoutableDefinition,
  RoutableFactory,
  RoutableRegistration,
} from './types';

/**
 * Injection key used internally to expose the active routable scope.
 *
 * Available starting in v1.1.0.
 *
 * @category Variables
 */
export const ROUTABLE_SCOPE_KEY = Symbol(
  'vue3-routable-scope'
) as InjectionKey<RoutableContainer>;

/**
 * A Vue plugin that exposes a routable container for the current app instance.
 *
 * Available starting in v1.1.0.
 *
 * @category Types
 */
export type RoutableScope = RoutableContainer & Plugin;

function isRoutableDefinition<T extends object>(
  registration: RoutableRegistration<T>
): registration is RoutableDefinition<T> {
  return (
    typeof registration === 'object' &&
    registration !== null &&
    'create' in registration &&
    'key' in registration
  );
}

function describeRegistration<T extends object>(
  registration: RoutableRegistration<T>
) {
  if (isRoutableDefinition(registration)) {
    return registration.label;
  }

  return registration.name || 'anonymous-routable';
}

function isRoutableClass<T extends object>(
  value: unknown
): value is RoutableClass<T> {
  return typeof value === 'function' && hasRegisteredClass(value.prototype);
}

function uniqueRegistrations<T extends object>(
  registrations: RoutableRegistration<T>[]
) {
  return Array.from(new Set(registrations));
}

function collectLazyModuleRegistrations(
  loadedModule: Record<string, any>
): RoutableRegistration<any>[] {
  const exportedValues = Object.values(loadedModule || {});
  const definitions = uniqueRegistrations(
    exportedValues.filter(isRoutableDefinition)
  );

  if (definitions.length > 0) {
    return definitions;
  }

  return uniqueRegistrations(exportedValues.filter(isRoutableClass));
}

function instantiateClass<T extends object>(RoutableClass: RoutableClass<T>): T {
  try {
    return new RoutableClass();
  } catch {
    throw new Error(
      `[vue3-routable] Failed to instantiate ${
        RoutableClass.name || 'routable'
      } without constructor arguments. Use defineRoutable('label', () => new YourController(...)) for SSR-safe registrations that need parameters.`
    );
  }
}

function instantiateRoutable<T extends object>(
  registration: RoutableRegistration<T>
) {
  if (isRoutableDefinition(registration)) {
    return {
      instance: registration.create(),
      source: registration.source,
    };
  }

  return {
    instance: instantiateClass(registration),
    source: registration,
  };
}

/**
 * Creates a routable registration that can be instantiated inside a per-app scope.
 *
 * Pass the decorated class directly when it can be created without constructor
 * arguments, or pass a label and factory when each app/request needs its own
 * custom instance.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export function defineRoutable<T extends object>(
  RoutableClass: RoutableClass<T>
): RoutableDefinition<T>;
export function defineRoutable<T extends object>(
  label: string,
  factory: RoutableFactory<T>
): RoutableDefinition<T>;
export function defineRoutable<T extends object>(
  arg1: string | RoutableClass<T>,
  arg2?: RoutableFactory<T>
): RoutableDefinition<T> {
  if (typeof arg1 === 'function') {
    return {
      key: Symbol(arg1.name || 'routable') as InjectionKey<T>,
      create: () => instantiateClass(arg1),
      label: arg1.name || 'routable',
      source: arg1,
    };
  }

  if (!arg2) {
    throw new Error(
      '[vue3-routable] defineRoutable(label, factory) requires a factory function.'
    );
  }

  return {
    key: Symbol(arg1) as InjectionKey<T>,
    create: arg2,
    label: arg1,
  };
}

/**
 * Creates a Vue plugin and routable container scoped to a single app instance.
 *
 * Use this in client-only apps and SSR app factories to keep controller
 * instances local to the current app creation instead of sharing module-level
 * singletons.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export function createRoutableScope(
  options: CreateRoutableScopeOptions
): RoutableScope {
  const runtime = createRoutableRuntime(options.routing);
  const instancesByRegistration = new Map<RoutableRegistration<any>, any>();
  const instancesByClass = new Map<RoutableClass<any>, any>();
  let installedApp: App | null = null;

  const register = (...registrations: RoutableRegistration<any>[]) => {
    withRoutableObjectRegistry(runtime.routableObjects, () => {
      for (const registration of registrations) {
        if (instancesByRegistration.has(registration)) {
          continue;
        }

        const { instance, source } = instantiateRoutable(registration);

        if (source && instancesByClass.has(source)) {
          throw new Error(
            `[vue3-routable] ${
              source.name || 'routable'
            } was registered multiple times in the same scope. Use defineRoutable('label', factory) for multiple instances of the same class.`
          );
        }

        instancesByRegistration.set(registration, instance);

        if (source) {
          instancesByClass.set(source, instance);
        }

        if (installedApp && isRoutableDefinition(registration)) {
          installedApp.provide(registration.key, instance);
        }
      }
    });
  };

  register(...options.routables);

  bindRouterToRoutableRuntime(options.router, runtime, options.routing);

  const container: RoutableContainer = {
    runtime,
    get<T extends object>(target: RoutableRegistration<T>) {
      if (instancesByRegistration.has(target)) {
        return instancesByRegistration.get(target);
      }

      if (typeof target === 'function' && instancesByClass.has(target)) {
        return instancesByClass.get(target);
      }

      throw new Error(
        `[vue3-routable] No routable instance is registered for ${describeRegistration(
          target
        )}.`
      );
    },
    has<T extends object>(target: RoutableRegistration<T>) {
      return (
        instancesByRegistration.has(target) ||
        (typeof target === 'function' && instancesByClass.has(target))
      );
    },
    register(...targets: RoutableRegistration<any>[]) {
      register(...targets);
    },
  };

  runtime.onLazyRoutableModuleLoaded = async (loadedModule) => {
    const registrations = collectLazyModuleRegistrations(loadedModule);

    if (registrations.length > 0) {
      container.register(...registrations);
    }
  };

  return {
    ...container,
    install(app) {
      installedApp = app;
      app.provide(ROUTABLE_SCOPE_KEY, container);

      for (const registration of instancesByRegistration.keys()) {
        if (isRoutableDefinition(registration)) {
          app.provide(registration.key, container.get(registration));
        }
      }
    },
  };
}

/**
 * Alias of `createRoutableScope` for plugin-style naming.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export const createRoutablePlugin = createRoutableScope;

/**
 * Retrieves the active routable scope from Vue dependency injection.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export function useRoutableScope(): RoutableContainer {
  const scope = inject(ROUTABLE_SCOPE_KEY, null);

  if (!scope) {
    throw new Error(
      '[vue3-routable] No routable scope found. Create one with createRoutableScope(...) and install it on the app before calling useRoutableScope().' 
    );
  }

  return scope;
}

/**
 * Resolves a routable instance from the active scope.
 *
 * Use this in components to retrieve controllers registered with either a
 * decorated class or a `defineRoutable(...)` definition.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export function useRoutable<T extends object>(
  target: RoutableRegistration<T>
): T {
  if (isRoutableDefinition(target)) {
    const directInstance = inject<T | null>(target.key, null);

    if (directInstance) {
      return directInstance;
    }
  }

  return useRoutableScope().get(target);
}

/**
 * Alias of `useRoutable` for users who prefer inject-style naming.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export const injectRoutable = useRoutable;