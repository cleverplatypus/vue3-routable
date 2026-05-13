import type { RoutableContainer } from './types';

let currentRoutableScope: RoutableContainer | undefined;

function isPromiseLike<T>(value: T): value is T & PromiseLike<Awaited<T>> {
  return !!value && typeof (value as PromiseLike<Awaited<T>>).then === 'function';
}

/**
 * Returns the ambient routable scope when one has been set explicitly.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export function getCurrentRoutableScope(): RoutableContainer | undefined {
  return currentRoutableScope;
}

/**
 * Sets or clears the ambient routable scope used outside Vue injection contexts.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export function setCurrentRoutableScope(
  scope: RoutableContainer | null | undefined
): void {
  currentRoutableScope = scope || undefined;
}

/**
 * Runs a callback with the provided scope set as the ambient routable scope.
 *
 * Available starting in v1.1.0.
 *
 * @category Functions
 */
export function withCurrentRoutableScope<T>(
  scope: RoutableContainer,
  callback: () => T
): T {
  const previousScope = currentRoutableScope;
  currentRoutableScope = scope;

  try {
    const result = callback();

    if (isPromiseLike(result)) {
      return Promise.resolve(result).finally(() => {
        currentRoutableScope = previousScope;
      }) as T;
    }

    currentRoutableScope = previousScope;
    return result;
  } catch (error) {
    currentRoutableScope = previousScope;
    throw error;
  }
}