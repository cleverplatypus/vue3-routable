# Vue3 Routable

![Tests](https://github.com/cleverplatypus/vue3-routable/actions/workflows/test.yml/badge.svg)
![NPM Version](https://img.shields.io/npm/v/vue3-routable)
![GitHub top language](https://img.shields.io/github/languages/top/cleverplatypus/vue3-routable)

**Clean, decorator-based MVC routing for Vue 3 applications without the complexity of state management libraries**

Vue3 Routable brings simplified MVC architecture to Vue 3, letting you organize route logic with intuitive TypeScript decorators. No framework-specific concepts to master—if you know TypeScript and vue-router, you're already 90% there.

Check out the [new docs](https://cleverplatypus.github.io/vue3-routable)

## Why Vue3 Routable?

Most Vue applications end up with scattered logic across components or heavy state management libraries for simple route-based state. Vue3 Routable provides a lightweight alternative that keeps your routing logic organized and your bundle optimized.

## Quick Example

```typescript
import { Routable, RouteActivated, RouteDeactivated, Param } from 'vue3-routable'
import productModel from '@/models/product-model'

@Routable('/products/:id')
class ProductController {
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
