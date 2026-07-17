# Injection Deep Dive

<Badge type="tip" text="Since v1.2.0" />
<Badge type="info" text="Scoped API" />

This page covers the lower-level scoped APIs when you want full control over wiring, or when you prefer not to use `@vue3-routable/vite-plugin`.

For the shorter plugin-first SSR setup, see [SSR Usage](/ssr).

## What can be resolved from the scope?

The active scope can expose more than controller classes.

In practice that includes:

- decorated classes registered directly in `createRoutableScope(...)`
- `defineScoped(...)` registrations whose factory returns any scope-managed object
- explicit Vue `provide/inject` values that you wire yourself alongside the routable scope when you want custom injection keys

`useScoped(...)` resolves scope registrations. Plain Vue `provide/inject` remains useful when you want a custom injection contract outside the routable registry.

## Without the plugin: useScoped(...)

If you skip the Vite plugin, the SSR-safe runtime shape stays the same. Hydration lists stay explicit: when you use `safeSingleton(...)`, SSR code can resolve backing registrations with `getSafeSingletonRegistration(...)`.

```typescript
// models/product-model.ts
import { reactive } from 'vue'
import { defineScoped } from 'scoped-container'

export type Product = {
  id: string
  name: string
  description: string
}

export type ProductModelState = {
  loading: boolean
  data: Product | null
}

export function createProductModel() {
  const state: ProductModelState = {
    loading: false,
    data: null,
  }

  return reactive(state)
}

export type ProductModel = ReturnType<typeof createProductModel>

export const productModel = defineScoped('product-model', createProductModel)
```

```typescript
// controllers/product-controller.ts
import { Param, Routable, RouteActivated } from '@vue3-routable/core'
import { useScoped } from '@vue3-routable/ssr'
import { productModel } from '@/models/product-model'

@Routable('/products/:id')
export class ProductController {
  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
    const model = useScoped(productModel)
    model.loading = true
    model.data = await fetchProduct(productId)
    model.loading = false
  }
}
```

```typescript
// app.ts
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutableScope, useScoped } from '@vue3-routable/ssr'
import App from './App.vue'
import { ProductController } from '@/controllers/product-controller'
import { productModel } from '@/models/product-model'

export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  const routableScope = createRoutableScope({
    router,
    registrations: [ProductController, productModel],
  })

  app.use(router)
  app.use(routableScope)

  return { app, router, routableScope }
}
```

```vue
<!-- ProductDetailView.vue -->
<script setup lang="ts">
import { productModel } from '@/models/product-model'

const model = useScoped(productModel)
</script>
```

This is the lower-level version of the same scoped pattern: no plugin-generated helper, just direct scoped resolution of the registered model object.

In SSR, wrap routing and rendering in `scoped-container`'s `withCurrentScope(...)` so direct lookups like `useScoped(productModel)` stay request-local outside component setup.

## Factory registrations for arbitrary scope-managed objects

`defineScoped(...)` can register any scope-managed object that you want to create per app or per request.

```typescript
// state/request-cache.ts
import { reactive } from 'vue'
import { defineScoped } from 'scoped-container'

export const requestCache = defineScoped('request-cache', () =>
  reactive({
    loading: false,
    items: new Map<string, string>(),
  })
)
```

```typescript
// app.ts
import { createRoutableScope, useScoped } from '@vue3-routable/ssr'
import { requestCache } from '@/state/request-cache'

const routableScope = createRoutableScope({
  router,
  registrations: [ProductController, requestCache],
})
```

```vue
<script setup lang="ts">
import { requestCache } from '@/state/request-cache'

const cache = useScoped(requestCache)
</script>
```

If you use the Vite plugin and export that registration from a scanned file, the same pattern can also surface as a generated helper based on the export name.

## Separate model factories and explicit injection

If you prefer keeping models separate from controllers, create the model with `defineScoped(...)`, register it alongside the decorated controller, and optionally expose the resolved instance under your own Vue injection key for components.

```typescript
// models/product-model.ts
import type { InjectionKey } from 'vue'
import { reactive } from 'vue'
import { defineScoped } from 'scoped-container'

export type Product = {
  id: string
  name: string
  description: string
}

export type ProductModelState = {
  data: Product | null
}

export function createProductModel() {
  const state: ProductModelState = {
    data: null,
  }

  return reactive(state)
}

export type ProductModel = ReturnType<typeof createProductModel>

export const productModel = defineScoped('product-model', createProductModel)
export const productModelKey = Symbol('product-model') as InjectionKey<ProductModel>
```

```typescript
// controllers/product-controller.ts
import { Param, Routable, RouteActivated } from '@vue3-routable/core'
import { useScoped } from '@vue3-routable/ssr'
import { productModel } from '@/models/product-model'

@Routable('/products/:id')
export class ProductController {
  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
    useScoped(productModel).data = await fetchProduct(productId)
  }
}
```

```typescript
// app.ts
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createRoutableScope } from '@vue3-routable/ssr'
import App from './App.vue'
import { ProductController } from '@/controllers/product-controller'
import {
  productModel,
  productModelKey,
} from '@/models/product-model'

export function createApp() {
  const app = createSSRApp(App)
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  const routableScope = createRoutableScope({
    router,
    registrations: [ProductController, productModel],
  })

  app.use(router)
  app.use(routableScope)
  app.provide(productModelKey, routableScope.get(productModel))

  return { app, router, routableScope }
}
```

Use this pattern when components should consume a custom Vue injection key while controllers still resolve the same request-scoped model through `useScoped(...)`.