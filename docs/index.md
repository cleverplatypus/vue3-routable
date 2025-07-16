---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Vue3 Routable"
  image: "./images/logo.svg"
  text: "MVC Controllers for Vue Router"
  tagline: Clean, decorator-based routing without the complexity of state management libraries
  actions:
    - theme: brand
      text: Get Started
      link: /guide
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

```typescript
import { Routable, RouteActivated, RouteDeactivated, Param } from 'vue3-routable'
import productModel from '@/models/product-model'

@Routable(/\/products\/\d+/')
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

Ready to simplify your Vue routing? [Get started with the guide](/guide) or explore the [API documentation](/api/globals).
