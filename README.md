<p align="center">
  <a href="https://cleverplatypus.github.io/vue3-routable/">
    <img src="./docs/public/images/logo.svg" alt="Vue3 Routable logo" width="120" />
  </a>
</p>
<h1 align="center">Vue3 Routable</h1>


<p align="center">
  <a href="https://www.npmjs.com/package/vue3-routable">
    <img alt="npm version" src="https://img.shields.io/npm/v/vue3-routable?color=cb0000&label=npm&logo=npm" />
  </a>
  <a href="https://www.npmjs.com/package/vue3-routable">
    <img alt="npm downloads" src="https://img.shields.io/npm/dm/vue3-routable" />
  </a>
  <a href="https://github.com/cleverplatypus/vue3-routable/actions/workflows/test.yml">
    <img alt="Tests" src="https://github.com/cleverplatypus/vue3-routable/actions/workflows/test.yml/badge.svg?branch=master" />
  </a>
  <a href="https://vitest.dev/">
    <img alt="tested with vitest" src="https://img.shields.io/badge/tested%20with-vitest-6E9F18?logo=vitest" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" />
  </a>
  <a href="LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg" />
  </a>
  <a href="https://bundlephobia.com/package/vue3-routable">
    <img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/vue3-routable?label=minzipped" />
  </a>
  <a href="https://cleverplatypus.github.io/vue3-routable/">
    <img alt="docs" src="https://img.shields.io/badge/docs-vitepress-2ea44f" />
  </a>
</p>

**Clean, decorator-based MVC routing for Vue 3 applications without the complexity of state management libraries**

Vue3 Routable brings simplified MVC architecture to Vue 3, letting you organize route logic with intuitive TypeScript decorators. No framework-specific concepts to master—if you know TypeScript and vue-router, you're already 90% there.

The framework-agnostic scoped container core now lives in the separate `scoped-container` package so the routing layer stays focused on Vue and vue-router concerns.

Until `scoped-container` is published to npm, local co-development uses `yalc`: run `npm run yalc:publish` in the sibling `scoped-container` repo, then run `yarn yalc:link:scoped-container` in this repo before typechecking or running tests.

Check out the [new docs](https://cleverplatypus.github.io/vue3-routable)

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Why Vue3 Routable?

Tools like VueX and Pinia are an effort to implement the store pattern at the cost of mixing the concerns of state management, routing and business logic in the same rigid store files. The idea is basically to try and create a finite state machine that can be used to manage the state of your application.

Vue3 Routable just provides a lightweight tool to annotate controllers with routing logic. Models are simply reactive objects that are used to store the state of your application. These objects can be typed with TypeScript and they are easy to relate to the code in your Vue components and controllers without cryptic mapState, mapGetters, mapActions and mapMutations kind of overstructured patterns.

How you do it and how disciplined you and your team are in using predictable patterns when mutating the state is really up to you. Code reviews and peer reviews are your best allies to enforce good practices. This cannot be delegated to a library.

Some tooling in Pinia help tracking state changes while debugging. At firset sight they seem quite impressive an usefule. However, IMHO, the need for such tools is at least in part due to the fact that complexity was added in the first place, making it more difficult to reason about the state of the application and debug the flow of state changes.

That being said, Vue3 Routable is going to have some tooling in the near future to help debugging in edge cases, particularly when the application gets more complex or the developer has overcomplicated it, sure, by accident :)

## Quick Example

```typescript
import {
  Routable,
  RouteActivated,
  RouteDeactivated,
  Param,
} from 'vue3-routable'
import productModel from '@/models/product-model'

@Routable('/products/:id')
export class ProductController {
  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
    productModel.data = await fetchProduct(productId);
  }

  @RouteDeactivated()
  cleanup() {
    // Clean up subscriptions, timers, etc.
  }
}
```

The scoped SSR runtime shown here is available starting in `v1.1.0`.

## Easy DX With the Vite Plugin

Available since `v1.1.0`.

If you use scoped registrations or ambient scope helpers, add `scoped-container` as a direct app dependency and import those APIs from there.

If you add `vue3-routable-vite-plugin`, it generates the lazy-route manifest plus typed declarations for that manifest. Hydration stays explicit and uses the same `safeSingleton(...)` imports your runtime code already uses.

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vue3RoutableVitePlugin } from 'vue3-routable-vite-plugin'

export default defineConfig({
  plugins: [vue(), vue3RoutableVitePlugin()],
})
```

```typescript
// models/product-model.ts
import { reactive } from 'vue'
import { safeSingleton } from 'scoped-container'

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

export const productModel = safeSingleton(createProductModel, {
  label: 'product-model',
})
```

```typescript
// server hydration list
import { getSafeSingletonRegistration } from 'scoped-container'
import { productModel } from '@/models/product-model'

const productModelRegistration = getSafeSingletonRegistration(productModel)

if (!productModelRegistration) {
  throw new Error('Expected productModel to be created with safeSingleton(...)')
}

export const hydratableModels = [productModelRegistration]
```

This keeps the app code and hydration code on the same direct imports, with one explicit registration lookup where SSR state is collected.

## SSR-Safe Registration

Available since `v1.1.0`.

Avoid `export default new Controller()` in SSR. Create a fresh scope when the app is created and register decorated controller classes plus any scoped registrations they depend on.

```typescript
import { createRoutableScope } from 'vue3-routable/ssr'
import { createRouter, createWebHistory } from 'vue-router'
import { ProductController } from '@/controllers/product-controller'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const routableScope = createRoutableScope({
  router,
  registrations: [ProductController],
})

app.use(router)
app.use(routableScope)
```

Inside components, use `useScoped(ProductController)` for controllers. Plain Vue `inject(...)` still works for explicit `defineScoped(...)` registrations when you want to expose your own injection key.

For direct Vue injection with explicit registrations, provide your own `InjectionKey` alongside the scoped registration and expose that key from the app.

For Node-compatible SSR runtimes, including AWS Lambda with a Node runtime, Bun, and Deno's Node compatibility layer, you can install the optional `AsyncLocalStorage` adapter from `vue3-routable/async-context-node` to keep SSR scope lookups request-local across async work outside Vue injection.

## Key Features

- **🎯 Zero Learning Curve** - Works seamlessly with existing vue-router configurations
- **🏗️ Decorator-Driven** - Clean, declarative syntax for route lifecycle management
- **⚡ Bundle Optimization** - Built-in code splitting with lazy loading support
- **🔧 Flexible Matching** - Route name, path, or custom pattern matching
- **🛡️ Route Guards** - Built-in navigation guards with parameter injection
- **📦 TypeScript First** - Full TypeScript support with experimental decorators

## Installation


The intended split is: `scoped-container` is the extracted framework-agnostic core for `defineScoped(...)`, `safeSingleton(...)`, `withCurrentScope(...)`, and the scope-context helpers, while `vue3-routable` adds decorators and the routing lifecycle on top, with SSR-oriented scope helpers exposed from `vue3-routable/ssr`.

If you use the scoped runtime, install both packages and import the generic scoped APIs from `scoped-container` directly.


```bash [npm]
npm install vue3-routable scoped-container
```

```bash [yarn]
yarn add vue3-routable scoped-container
```

```bash [pnpm]
pnpm add vue3-routable scoped-container
```
