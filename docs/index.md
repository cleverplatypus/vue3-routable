---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Vue3 Routable"
  image: "./images/logo.svg"
  text: "MVC Controllers for Vue Router"
  tagline: Clean, decorator-based routing with SSR-safe controller scopes for Vue 3 applications
  actions:
    - theme: brand
      text: Get Started
      link: /guide
    - theme: alt
      text: SSR Usage
      link: /ssr
    - theme: alt
      text: View on GitHub
      link: https://github.com/cleverplatypus/vue3-routable

features:
  - icon: 🎯
    title: Zero Learning Curve
    details: No framework-specific concepts to master. If you know TypeScript and vue-router, you're already 90% there. Bring new developers onto your project without the usual framework onboarding overhead.
  - icon: 🏗️
    title: Decorator-Driven Architecture
    details: Transform your route components into organized MVC controllers with simple TypeScript decorators. Handle route lifecycle events, parameter injection, and navigation guards with clean, declarative syntax.
  - icon: 🧩
    title: SSR-Ready Scopes
    details: Create a fresh routable scope per app or request. Lazy-loaded classes and defineRoutable registrations attach to the active scope without relying on process-wide singletons.
  - icon: ⚡
    title: Bundle Optimization
    details: Built-in code splitting support ensures your route controllers are loaded only when needed. Improve your app's initial load time while maintaining clean separation of concerns.
---
## Why Vue3 Routable?

Are you tired of the complexity that comes with Vuex or Pinia for simple route-based state management? Vue3 Routable brings the simplicity of MVC patterns to Vue 3 applications, letting you organize your route logic without the overhead of global state management libraries.

### The Problem with Traditional Approaches

Most Vue applications end up with one of these common patterns:
- Scattered logic across components with no clear separation of concerns
- Heavy state management libraries for what should be simple route-based state
- Complex setup that requires extensive framework-specific knowledge

### The Vue3 Routable Solution

Vue3 Routable introduces a lightweight, decorator-based approach that:
- Keeps it simple - Use plain TypeScript classes with intuitive decorators
- Stays close to natural Vue3 and TypeScript development - Works seamlessly with existing router configurations. No additional constructs to learn.
- Scales naturally - From simple route handlers to complex lazy-loaded controllers
- Supports SSR cleanly - Build a fresh controller scope for every app or request instead of depending on module singletons

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

<Badge type="tip" text="Since v1.1.0" />

The scoped SSR API shown here, including `defineRoutable(...)`, is part of the `v1.1.0` release line.

Ready to simplify your Vue routing? [Get started with the guide](/guide), check the [SSR usage guide](/ssr), or explore the [API documentation](/api/).
