# Getting Started

Vue3 Routable is a lightweight, decorator-based routing library that brings simplified MVC architecture to Vue 3 applications. It works seamlessly with Vue Router to provide clean separation of concerns without the complexity of global state management libraries.

## Installation

Install Vue3 Routable using your preferred package manager:

::: code-group

```bash [npm]
npm install vue3-routable
```

```bash [yarn]
yarn add vue3-routable
```

```bash [pnpm]
pnpm add vue3-routable
```

:::

Optionally install the [lazy loading vite plugin](https://www.npmjs.com/package/vue3-routable-vite-plugin) for better performance in bigger projects (See [Lazy Loading](#lazy-loading) for more info):

<Badge type="tip" text="Since v1.1.0" /> Install `vue3-routable-vite-plugin` for the active plugin release line. The legacy `vue3-routable-lazy-loader` package should be treated as deprecated in favor of the renamed package.

::: code-group

```bash [npm]
npm install --D vue3-routable-vite-plugin
```

```bash [yarn]
yarn add --dev vue3-routable-vite-plugin
```

```bash [pnpm]
pnpm add --save-dev vue3-routable-vite-plugin
```

:::

### TypeScript Configuration

Vue3 Routable requires TypeScript with experimental decorators enabled. Add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Quick Start

### 1. Create the app scope

Create a fresh routable scope alongside your Vue app. That keeps controller instances local to the current app creation, which is safe for SSR and still works fine in client-only apps.

<Badge type="tip" text="Since v1.1.0" />

This scoped API, including `createRoutableScope(...)`, `defineRoutable(...)`, and `useRoutable(...)`, is part of the `v1.1.0` release line.

For a full SSR app-factory example, including request-scoped reactive state and lazy loading, see [SSR Usage](/ssr).

```typescript
// main.ts
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createRoutableScope } from 'vue3-routable'
import App from './App.vue'
import { productController } from '@/controllers/product-controller'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/products/:id', component: ProductDetailView },
    // ... your other routes
  ]
})

const routableScope = createRoutableScope({
  router,
  routables: [productController],
})

createApp(App).use(router).use(routableScope).mount('#app')
```

### 2. Create your models and controllers

Controllers are in charge of the business logic for a specific route. 
Models contain the data for the business logic and provide reactivity for the view.

Avoid `export default new ProductController()` in SSR applications. Export either the class itself or a `defineRoutable(...)` registration so each app/request gets a fresh instance.

The model below is module-scoped for brevity. In SSR, make reactive models request-scoped too; the dedicated [SSR Usage](/ssr) page shows both a controller-owned state pattern and a separate model factory pattern.

::: code-group

```typescript [product-controller.ts]
// controllers/product-controller.ts
import {
  Routable,
  RouteActivated,
  RouteDeactivated,
  Param,
  defineRoutable,
} from 'vue3-routable'
import productModel, {resetModel} from '@/models/product'

@Routable('/products/:id')
export class ProductController {
  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
      resetModel()
      productModel.data = await fetchProduct(productId)
  }

  @RouteDeactivated()
  cleanup() {
    resetModel()
  }
}

export const productController = defineRoutable(ProductController)
```

```typescript [product-model.ts]
// models/product-model.ts
import { reactive } from 'vue'

export const productModel = reactive({
    data: {
        id: '',
        name: '',
        description: '',
    }
})

export function resetModel() {
    Object.assign(productModel.data, {
        id: '',
        name: '',
        description: '',
    })
}
```

:::

### 3. Expose the reactive data to your component

Expose the reactive data to your component by importing the model.
As soon as the route is activated, the controller will load the data and update the model. If the component needs to call controller methods directly, you can inject the scoped instance too.
```vue
<!-- ProductDetailView.vue -->
<template>
  <div>
      <h1>{{ productModel.data.name }}</h1>
      <p>{{ productModel.data.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'

import productModel from '@/models/product-model'
import { productController } from '@/controllers/product-controller'

const controller = inject(productController.key)

</script>
```

<Badge type="tip" text="Since v1.1.0" /> If your controller has no constructor arguments, you can skip `defineRoutable(...)`, register the class directly in `createRoutableScope({ routables: [ProductController] })`, and consume it with `useRoutable(ProductController)`.

For client-only SPAs, the legacy `registerRouter(router)` plus module-level singleton instances still works, but the scoped setup above is the SSR-safe default.

If you are rendering on the server, also avoid module-level reactive models, caches, and service objects that hold request-specific data.

## Core Concepts

### Route Matching

#### Statically using the `@Routable` decorator
The `@Routable()` decorator accepts route patterns that determine when your routable object should be active.
By defaut the pattern will try to match the route's name but the library can also be configured to match the route's name chain (a concatenation of all parent routes' names) or the URL path.

Notice that if you have multiple instances of the same decorated class, all of them will be activated when the route is matched. For per-instance matching, see below the `@RouteMatcher` decorator.

```typescript
// Match exact route name
@Routable('product')

// Match any route name that contains with 'product'
@Routable(/product/)

// Match any route name that starts with 'admin/'
@Routable(/^admin\/*/)

// Match multiple routes
@Routable(['products', 'offers'])
```

#### Dynamically using the `@RouteMatcher` decorator

> **Important:** The `@RouteMatcher` still requires the class to be decorated with `@Routable()`.

The `@RouteMatcher` decorator accepts a function that returns a boolean value indicating whether the instance should be activated for the given route.

```typescript
@Routable()
class SomeController {
    @RouteMatcher()
    shouldActivate(route: RouteLocationNormalized): boolean {
        // Custom logic to determine if this controller should be active
        return route.path.startsWith('/special') && 
               route.query.mode === 'advanced'
    }
}
```

### Lifecycle Methods

Controllers provide several lifecycle hooks to manage route transitions.

> **Important:** Methods decorated with `@RouteActivated()` only get called when the instance is first activated by the pattern matching. If the router  moves to another route that still matches the same pattern, the instance will not be reactivated. Use `@RouteUpdated()` for that.

```typescript
@Routable('/dashboard')
export class DashboardController {
  @RouteActivated()
  onEnter() {
    // Called when the route becomes active
    console.log('Dashboard activated')
  }

  @RouteDeactivated()
  onLeave() {
    // Called when leaving the route
    console.log('Dashboard deactivated')
  }

  @RouteUpdated()
  onUpdate() {
    // Called when route params change but staying on same route
    console.log('Dashboard updated')
  }
}
```

### Parameter Injection

Easily access route parameters, query strings, and navigation data:

```typescript
@Routable('/users/:id')
export class UserController {
  @RouteActivated()
  loadUser(
    @Param('id') userId: string,
    @Query('tab') activeTab: string,
    @Meta('permissions') permissions: string[],
    @To() toRoute: RouteLocationNormalized,
    @From() fromRoute: RouteLocationNormalized
  ) {
    // userId contains the :id parameter
    // activeTab contains the ?tab=... query parameter
    // toRoute and fromRoute contain full route objects
  }
}
```
> The '@To' and '@From' decorators also accept a path parameter to inject a specific property of the route object.

### Route Guards

It's possible to annotate routable objects with navigation guards to control navigation.


#### Example: access control
In the following example a controller is annotated with the `@GuardRouteEnter` decorator to control navigation to admin routes.

The access setup is conveniently declared in the router's 'allow' meta property, making it easy to manage access control in a configuration fashion.

Of course cascading access control for nested routes is possible with some additional logic in the guard method but this is beyound the scope of this example.

::: code-group

```typescript [router.ts]
// ...
import sessionModel from '@/models/session-model'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/admin/*', 
      component: AdminView,
      meta : {
        allow: () => sessionModel.data.isAdmin
      }
    },
  ]
})
// ...
```

```typescript [access-controller.ts]
@Routable(/.*/)
export class AccessController {
  @GuardRouteEnter({ priority : 10000 })
  async canEnter(@Meta('allow') allow: () => boolean) {
    if (allow && !allow()) {
      return { name: 'Login' } // Redirect to login
    }
    return true
  }
}

export default new AccessController()
```
:::

#### Example: unsaved changes
A singleton controller can be created to keep track of the `isDirty` state of the currently edited model.
The `@GuardRouteLeave` decorator can be used to control navigation away from the route.

::: code-group

```typescript [current-editor-controller.ts]

@Routable(/.*/)
export class CurrentEditorController {
  currentEditorModel : DirtableModel

  setCurrentEditorModel(editorModel : DirtableModel) {
    this.currentEditorModel = editorModel
  }

  @GuardRouteLeave({ priority : 10000 })
  async canLeave() {
    if (this.currentEditorModel.isDirty) {
      const confirmLeave = await confirm('You have unsaved changes. Continue?')
      if (!confirmLeave) {
        return false
      }
    }
    return true
  }
}

export default new CurrentEditorController()
```
:::

### Route Watchers

Watchers behave pretty much like route enter/exit/guards but they cannot affect navigation.
Also, they are called every time a route matching the pattern is hit, not just the first time navigation hits the pattern.

```typescript
@RouteWatcher({ 
  match: 'product',
  priority: 1000,
  on : 'enter'
})
onProductPageHit(@Param('productId') productId: string) {
  console.log('Product page hit', productId)
}
```

## Advanced Usage

### Configuring matching target

By default the library will try to match the route's name but the library can also be configured to match the route's name chain (a concatenation of all parent routes' names) or the URL path.

To configure the matching target, pass the `defaultMatchTarget` option to the `registerRouter` function:

The `routeNameChainSeparator` option can be used to configure the separator used to concatenate the route names. By default it is a dot ('.') but it can be changed to any string.

```typescript
registerRouter(router, { 
  defaultMatchTarget: 'name-chain',
  routeNameChainSeparator: '/'
})
```

### Lazy loading
By default the library will match routes on routable objects that are in the main application bundle. For that to happen, you have to have your routable files referenced somewhere in your application.

> Notice that it's not enough to import the files, for instance, in your `main.ts` file as Vite will optimize the bundle and will consider the file as unused, thus removing it from the bundle.

> Also, if your vue views are dynamically imported and your routable classes are only referenced in the views, the routable classes will be loaded too late and they won't be available when the router tries to match the routes.

To make sure the file is included in the bundle, you can use the `registerRoutableClasses` function to register the routable classes.

```typescript
import { registerRoutableClasses } from 'vue3-routable'

registerRoutableClasses(ProductController, ProductDetailController)
```

You can include the `vue3-routable-vite-plugin` package to lazy load your routables.

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vue3RoutableVitePlugin } from 'vue3-routable-vite-plugin'

export default defineConfig({
  plugins: [vue(), vue3RoutableVitePlugin()],
})
```

The renamed package still exports `vue3RoutableLazyLoader` and `vue3RoutablePlugin` as compatibility aliases if you want to keep the old symbol names in application code during migration.

The plugin will automatically register the routable classes annotated with `@Routable` and will lazy load them when needed.
You won't need to call `registerRoutableClasses` for those.

<Badge type="tip" text="Since v1.1.0" /> The scope-aware lazy registration path described below works with the `v1.1.0` scoped runtime.

Lazy loading only decides when a module is imported. In SSR, still create controller instances inside `createRoutableScope(...)` and avoid exporting singleton controller instances from the lazy-loaded module.

There are situations where annotating the class is not viable. For instance, a class can be instantitated multiple times for different routes, each with different parameters. In this case, you can export the `ROUTABLE_TARGETS` constant that instructs the lazy-loading plugin when to load the file.

In the following example a generic ListController is instantiated for multiple routes and its specifics is driven by the `source` property.

Route activation is driven by the `@RouteMatcher` annotated method which is evaluated per-instance.

::: code-group

```typescript [list-controller.ts]
@Routable()
export default class ListController {
  targetRoutes: string[];
  source: string;
  constructor({targetRoutes, source}: {targetRoutes: string[], source: string}) {
    this.targetRoutes = targetRoutes;
    this.source = source;
  }
  @RouteMatcher() //per-instance matcher
  shouldActivate(route: RouteLocation) {
    const targets = Array.isArray(this.targetRoutes)
      ? this.targetRoutes
      : [this.targetRoutes]
    return targets.includes(route.name as string)
  }

  // implementation details
}
```

```typescript [customers-list-controller.ts]
import { defineRoutable } from 'vue3-routable'
import ListController from './list-controller'

export const ROUTABLE_TARGETS = ['customers-list'];

export const customersListController = defineRoutable(
  'customers-list-controller',
  () =>
    new ListController({
      targetRoutes: ROUTABLE_TARGETS,
      source: 'customers',
    })
)
```
:::

Register `customersListController` in the scope you create for the current app or SSR request.

## What's Next?

- Explore the [API Reference](/api/) for detailed documentation
- Join the discussion on [GitHub Discussions](https://github.com/cleverplatypus/vue3-routable/discussions)
