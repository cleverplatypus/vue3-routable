# SSR Usage

<Badge type="tip" text="Since v1.2.0" />
<Badge type="info" text="Scoped API" />

SSR adds one complication compared to a client-only app: the server renders many requests over time, so module-level singleton instances are reused across renders.

That is a problem for anything stateful. If a controller, model, store, or cache keeps request-specific data and lives as a singleton, one render can leak state into the next one.

If SSR is a requirement, those stateful objects need to be scoped to the current app creation or current request instead of being created once at module import time.

Stateless utilities and services can still stay as singletons. The rule only matters for objects that hold mutable per-request state.

The easiest SSR setup in `v1.2.0` is to keep routing decorators in `@vue3-routable/core`, use `@vue3-routable/ssr` for scope-aware state and request-local resolution, and add `@vue3-routable/vite-plugin` when you want the lazy-route manifest. Hydration stays explicit: resolve backing registrations with `getSafeSingletonRegistration(...)`, serialize them on the server, and install that snapshot before the client app boots.

## Easiest path: safeSingleton + explicit hydration registrations

If you want the most approachable setup for new users, start here.

Install `@vue3-routable/core` and `@vue3-routable/ssr`. Add `@vue3-routable/vite-plugin` when you want lazy-route manifest generation.

::: code-group

```bash [npm]
npm install @vue3-routable/core @vue3-routable/ssr
npm install --save-dev @vue3-routable/vite-plugin
```

```bash [yarn]
yarn add @vue3-routable/core @vue3-routable/ssr
yarn add --dev @vue3-routable/vite-plugin
```

```bash [pnpm]
pnpm add @vue3-routable/core @vue3-routable/ssr
pnpm add --save-dev @vue3-routable/vite-plugin
```

:::

- export a decorated class and any `safeSingleton(...)` or `defineScoped(...)` registrations it uses
- create the scope with `createRoutableScope({ router })`
- resolve hydration registrations explicitly from the same `safeSingleton(...)` imports your runtime uses
- wrap the SSR render flow in `withCurrentScope(...)`
- call `installHydratedState(...)` before the client app boots so `seedFactory: getHydratedState` can consume the snapshot

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vue3RoutableVitePlugin } from '@vue3-routable/vite-plugin'

export default defineConfig({
  plugins: [vue(), vue3RoutableVitePlugin()],
})
```

```typescript
// models/product-model.ts
import { reactive } from 'vue'
import { safeSingleton } from '@vue3-routable/ssr'
import { getHydratedState } from '@vue3-routable/ssr/hydration'

export type Product = {
  id: string
  name: string
  description: string
}

export type ProductModelState = {
  loading: boolean
  data: Product | null
}

export function createProductModel(initialState?: ProductModelState) {
  const state: ProductModelState = initialState || {
    loading: false,
    data: null,
  }

  return reactive(state)
}

export type ProductModel = ReturnType<typeof createProductModel>

export const productModel = safeSingleton(createProductModel, {
  label: 'product-model',
  seedFactory: getHydratedState,
})
```

```typescript
// controllers/product-controller.ts
import { Param, Routable, RouteActivated } from '@vue3-routable/core'
import { productModel } from '@/models/product-model'

@Routable('/products/:id')
export class ProductController {
  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
    productModel.loading = true
    productModel.data = await fetchProduct(productId)
    productModel.loading = false
  }
}
```

```typescript
// app.ts
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutableScope } from '@vue3-routable/ssr'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  const routableScope = createRoutableScope({ router })

  app.use(router)
  app.use(routableScope)

  return { app, router, routableScope }
}
```

```typescript
// entry-server.ts
import { renderToString } from 'vue/server-renderer'
import {
  getSafeSingletonRegistration,
  withCurrentScope,
} from '@vue3-routable/ssr'
import {
  collectHydratedState,
  renderHydratedStateScript,
} from '@vue3-routable/ssr/hydration'
import { installAsyncLocalStorageScopeContext } from '@vue3-routable/ssr/async-context-node'
import { productModel } from '@/models/product-model'
import { createApp } from './app'

installAsyncLocalStorageScopeContext()

export async function render(url: string) {
  const { app, router, routableScope } = createApp()
  const productModelRegistration = getSafeSingletonRegistration(productModel)

  if (!productModelRegistration) {
    throw new Error('Expected productModel to be created with safeSingleton(...)')
  }

  return withCurrentScope(routableScope, async () => {
    await router.push(url)
    await router.isReady()

    const html = await renderToString(app)
    const hydratableModels = [productModelRegistration]

    return {
      html,
      stateScript: renderHydratedStateScript(
        collectHydratedState(routableScope, hydratableModels)
      ),
    }
  })
}
```

```typescript
// entry-client.ts
import { installHydratedState } from '@vue3-routable/ssr/hydration'
import { createApp } from './app'

installHydratedState(window.__VUE3_ROUTABLE_SSR_STATE__)

createApp()
```

```vue
<!-- ProductDetailView.vue -->
<script setup lang="ts">
import { productModel } from '@/models/product-model'
</script>

<template>
  <div v-if="productModel.data">
    <h1>{{ productModel.data.name }}</h1>
    <p>{{ productModel.data.description }}</p>
  </div>
</template>
```

This keeps the controller instance and the reactive model object scoped to the current SSR request while component code stays on direct imports.

The plugin role is narrower in this setup: `@vue3-routable/vite-plugin` generates the lazy-route manifest and its declarations, while hydration stays explicit through `getSafeSingletonRegistration(...)`, `collectHydratedState(...)`, and `installHydratedState(...)`.

Avoid module-level singleton instances such as `export default new MyController()` when the app is rendered on the server.

If you want the lower-level `useScoped(...)`, custom injection keys, or explicit `registrations: [...]` wiring without the plugin, see [Injection Deep Dive](/injection-deep-dive).

## Runtime-targeted handlers

<Badge type="tip" text="Since v1.2.0" />

The route-change decorators that execute handlers accept a runtime target:

- `@RouteActivated({ runtime: 'ssr' | 'browser' | 'both' })`
- `@RouteUpdated({ runtime: 'ssr' | 'browser' | 'both' })`
- `@RouteDeactivated({ runtime: 'ssr' | 'browser' | 'both' })`

If you omit `runtime`, the default is `'both'`.

Use these runtime targets intentionally:

- `'ssr'` for request-only work such as preparing initial state, fetching server-rendered data, or setting response-oriented metadata that should not rerun during hydration
- `'browser'` for DOM APIs, analytics, timers, web storage, or any side effect that only makes sense in the client runtime
- `'both'` when the same handler logic should run in each environment

```typescript
// current-store-controller.ts
import type { RouteLocation } from 'vue-router'
import {
  Routable,
  RouteActivated,
  RouteUpdated,
  To,
} from '@vue3-routable/core'

@Routable(/.*/)
export class CurrentStoreController {
  @RouteActivated({ priority: 100, runtime: 'ssr' })
  async primeInitialStore(@To() to: RouteLocation) {
    await this.loadStoreFromRoute(to)
  }

  @RouteUpdated({ runtime: 'browser' })
  trackClientNavigation() {
    this.sendAnalytics()
  }
}
```

If you want a handler to inspect its own execution runtime or disable itself after running, see [Parameter Injection](/guide#parameter-injection) and [Route handlers control](/guide#route-handlers-control).

## Node-compatible async context

<Badge type="tip" text="Since v1.2.0" />

The `entry-server.ts` example above uses the optional async-context adapter so `withCurrentScope(...)` remains request-local across asynchronous work. Import it from `@vue3-routable/ssr/async-context-node`.

This adapter is intended for Node-compatible runtimes, including:

- Node.js SSR servers
- AWS Lambda with a Node runtime
- Bun
- Deno when using its Node compatibility layer

Inside Vue components, `useScoped(...)` still resolves through Vue injection first. The async-context adapter is mainly for request-local resolution outside component setup, such as SSR helper layers.

## Edge-style runtimes

For true isolate-style edge runtimes, prefer explicit request-bound scope handling over a global ambient fallback.

Create the routable scope inside the request handler, keep it attached to the current request lifecycle, and either:

- rely on Vue injection inside the rendered app, or
- close over `routableScope` in request-local helpers

Avoid using the ambient `setCurrentScope(...)` fallback as the primary SSR mechanism in concurrent edge environments, because that fallback is process-global rather than request-local.

## Lazy loading in SSR

<Badge type="tip" text="Since v1.2.0" /> The scope-aware lazy-loading flow described here is part of the `v1.2.0` release line.

The Vite plugin only controls lazy-route metadata and declaration generation around module imports. The imported module still needs to expose SSR-safe registrations.

Use one of these patterns in lazy-loaded files:

- export a decorated class that can be instantiated without constructor arguments
- optionally export labeled `safeSingleton(...)` values that SSR code includes in hydration registration lists

Avoid exporting singleton instances from lazy-loaded modules.

```typescript
// customers-list-controller.ts
import { Routable } from '@vue3-routable/core'
import ListController from './list-controller'

export const ROUTABLE_TARGETS = ['customers-list']

@Routable(ROUTABLE_TARGETS)
export class CustomersListController extends ListController {
  constructor() {
    super({
      targetRoutes: ROUTABLE_TARGETS,
      source: 'customers',
    })
  }
}
```

When a route matches, `@vue3-routable/vite-plugin` imports the module and the active `@vue3-routable/ssr` scope registers the exported decorated classes into the current request scope. Any labeled exported `safeSingleton(...)` values can be resolved explicitly with `getSafeSingletonRegistration(...)` when SSR hydration wiring needs their backing registrations.

## Client-only applications

If your app is purely client-side, the legacy `registerRouter(router)` plus module-level singleton instances still works.

That path is still supported through `@vue3-routable/core`, but the scoped API is the recommended default because it also works for SSR and lazy-loaded routes.