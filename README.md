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
  defineRoutable,
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

export const productController = defineRoutable(ProductController)
```

The scoped registration helpers shown here, including `defineRoutable(...)`, are available starting in `v1.1.0`.

## SSR-Safe Registration

Available since `v1.1.0`.

Avoid `export default new Controller()` in SSR. Create a fresh scope when the app is created and register either zero-argument controller classes or explicit factories.

```typescript
import { createRoutableScope } from 'vue3-routable'
import { createRouter, createWebHistory } from 'vue-router'
import { productController } from '@/controllers/product-controller'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const routableScope = createRoutableScope({
  router,
  routables: [productController],
})

app.use(router)
app.use(routableScope)
```

Inside components, use `useRoutable(productController)` or plain Vue `inject(productController.key)` to access the scoped instance.

## Key Features

- **🎯 Zero Learning Curve** - Works seamlessly with existing vue-router configurations
- **🏗️ Decorator-Driven** - Clean, declarative syntax for route lifecycle management
- **⚡ Bundle Optimization** - Built-in code splitting with lazy loading support
- **🔧 Flexible Matching** - Route name, path, or custom pattern matching
- **🛡️ Route Guards** - Built-in navigation guards with parameter injection
- **📦 TypeScript First** - Full TypeScript support with experimental decorators

## Installation


```bash [npm]
npm install vue3-routable
```

```bash [yarn]
yarn add vue3-routable
```

```bash [pnpm]
pnpm add vue3-routable
```
