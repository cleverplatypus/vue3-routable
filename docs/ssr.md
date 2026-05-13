# SSR Usage

<Badge type="tip" text="Since v1.1.0" />
<Badge type="info" text="Scoped API" />

The scoped, non-singleton API described on this page, including `createRoutableScope(...)`, `defineRoutable(...)`, `useRoutable(...)`, and `injectRoutable(...)`, is introduced in this release.

Vue3 Routable works with SSR as long as the objects that carry request-specific state are created when the app is created, not when the module is imported.

That rule applies to:

- routable controllers
- reactive models and stores
- caches or services that contain per-request data

## The rule of thumb

Avoid module-level singleton instances such as `export default new MyController()` when the app is rendered on the server.

Instead:

1. create the router inside your app factory
2. create a fresh routable scope for that router
3. register classes or `defineRoutable(...)` factories in that scope
4. keep reactive state on the controller instance or create models per request

## Recommended minimal pattern

The least verbose SSR-safe approach is to keep the reactive state on the controller instance and register the decorated class directly.

```typescript
// controllers/product-controller.ts
import { reactive } from 'vue'
import { Param, Routable, RouteActivated } from 'vue3-routable'

@Routable('/products/:id')
export class ProductController {
  state = reactive({
    loading: false,
    data: null as null | {
      id: string
      name: string
      description: string
    },
  })

  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
    this.state.loading = true
    this.state.data = await fetchProduct(productId)
    this.state.loading = false
  }
}
```

```typescript
// app.ts
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutableScope } from 'vue3-routable'
import App from './App.vue'
import { ProductController } from '@/controllers/product-controller'

export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  const routableScope = createRoutableScope({
    router,
    routables: [ProductController],
  })

  app.use(router)
  app.use(routableScope)

  return { app, router, routableScope }
}
```

```vue
<!-- ProductDetailView.vue -->
<script setup lang="ts">
import { useRoutable } from 'vue3-routable'
import { ProductController } from '@/controllers/product-controller'

const productController = useRoutable(ProductController)
</script>

<template>
  <div v-if="productController.state.data">
    <h1>{{ productController.state.data.name }}</h1>
    <p>{{ productController.state.data.description }}</p>
  </div>
</template>
```

This pattern keeps both the controller instance and its reactive state scoped to the current SSR request.

## Separate model factories

If you prefer keeping models separate from controllers, create those models in the app factory too.

```typescript
// models/product-model.ts
import type { InjectionKey } from 'vue'
import { reactive } from 'vue'

export type ProductModel = ReturnType<typeof createProductModel>

export const productModelKey = Symbol('product-model') as InjectionKey<ProductModel>

export function createProductModel() {
  return reactive({
    data: null as null | {
      id: string
      name: string
      description: string
    },
  })
}
```

```typescript
// controllers/product-controller.ts
import type { InjectionKey } from 'vue'
import type { ProductModel } from '@/models/product-model'
import { Param, Routable, RouteActivated, defineRoutable } from 'vue3-routable'

@Routable('/products/:id')
export class ProductController {
  constructor(private readonly productModel: ProductModel) {}

  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
    this.productModel.data = await fetchProduct(productId)
  }
}

export const productControllerKey = Symbol('product-controller') as InjectionKey<ProductController>

export function createProductController(model: ProductModel) {
  return defineRoutable('product-controller', () => new ProductController(model))
}
```

```typescript
// app.ts
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutableScope } from 'vue3-routable'
import App from './App.vue'
import {
  createProductController,
  productControllerKey,
} from '@/controllers/product-controller'
import { createProductModel, productModelKey } from '@/models/product-model'

export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  const productModel = createProductModel()
  const productController = createProductController(productModel)
  const routableScope = createRoutableScope({
    router,
    routables: [productController],
  })

  app.use(router)
  app.use(routableScope)
  app.provide(productModelKey, productModel)
  app.provide(productControllerKey, routableScope.get(productController))

  return { app, router, routableScope }
}
```

Use this pattern when the controller needs constructor arguments or when you want to keep state and behavior in separate objects.

## Lazy loading in SSR

<Badge type="tip" text="Since v1.1.0" /> The scope-aware lazy-loading flow described here is part of the `v1.1.0` release line.

The lazy-loader plugin only controls when the module is imported. The imported module still needs to expose SSR-safe registrations.

Use one of these patterns in lazy-loaded files:

- export a decorated class that can be instantiated without constructor arguments
- export a `defineRoutable(...)` registration

Avoid exporting singleton instances from lazy-loaded modules.

```typescript
// customers-list-controller.ts
import { defineRoutable } from 'vue3-routable'
import ListController from './list-controller'

export const ROUTABLE_TARGETS = ['customers-list']

export const customersListController = defineRoutable(
  'customers-list-controller',
  () =>
    new ListController({
      targetRoutes: ROUTABLE_TARGETS,
      source: 'customers',
    })
)
```

When a route matches, `vue3-routable-lazy-loader` imports the module and Vue3 Routable registers the exported classes or `defineRoutable(...)` definitions into the active scope.

## Client-only applications

If your app is purely client-side, the legacy `registerRouter(router)` plus module-level singleton instances still works.

That path is still supported, but the scoped API is the recommended default because it also works for SSR and lazy-loaded routes.