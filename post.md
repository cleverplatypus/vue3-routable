# Stop Fighting Vue Router: Meet Vue3 Routable, Your New Best Friend! 🚀

## The Problem: Router Hell is Real 😱

Picture this: You're building a Vue 3 app and you need to load some data when a user hits `/products/123`. So you write this beautiful component:

```vue
<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
let productData = ref(null)

onMounted(async () => {
  if (route.name === 'product') {
    productData.value = await fetchProduct(route.params.id)
  }
})

watch(route, async (newRoute) => {
  if (newRoute.name === 'product') {
    productData.value = await fetchProduct(newRoute.params.id)
  }
})

// Don't forget to clean up when leaving... somewhere... maybe in onUnmounted?
// Wait, what if the user navigates to a different product? 🤔
</script>
```

And then you realize you need the same logic in 5 different components. Copy-paste time! 📋

But wait, there's more! What about route guards? Access control? Cleaning up subscriptions? Pretty soon your components look like they've been through a blender. 🥤

## Enter Vue3 Routable: The Hero We Didn't Know We Needed 🦸‍♂️

Vue3 Routable brings back the joy of clean, organized code with TypeScript decorators. It's like having a personal assistant for your routes:

```typescript
import { Routable, RouteActivated, RouteDeactivated, Param } from 'vue3-routable'
import productModel from '@/models/product-model'

@Routable('/products/:id')
export class ProductController {
  @RouteActivated()
  async loadProduct(@Param('id') productId: string) {
    productModel.data = await fetchProduct(productId)
  }

  @RouteDeactivated()
  cleanup() {
    // Clean up subscriptions, cancel requests, etc.
  }
}

export default new ProductController()
```

**That's it.** No watchers, no route guards scattered everywhere, no "did I remember to clean up?" anxiety. Just clean, declarative code that actually makes sense.

## Real-World Examples That'll Make You Smile 😊

### 1. Parameter Injection (Because Who Has Time for `route.params.whatever`?)

```typescript
@Routable('/users/:id')
export class UserController {
  @RouteActivated()
  loadUser(
    @Param('id') userId: string,
    @Query('tab') activeTab: string,
    @Meta('permissions') permissions: string[]
  ) {
    // Everything you need, delivered on a silver platter
  }
}
```

### 2. Route Guards That Don't Make You Cry

```typescript
@Routable(/admin/)
export class AdminController {
  @GuardRouteEnter()
  async canEnter(@Meta('requiresAdmin') requiresAdmin: boolean) {
    if (requiresAdmin && !user.isAdmin) {
      return { name: 'Login' } // Redirect like a boss
    }
    return true
  }
}
```

### 3. Unsaved Changes Protection (Your Users Will Thank You)

```typescript
@Routable(/.*/)
export class DirtyFormController {
  @GuardRouteLeave()
  async canLeave() {
    if (this.hasUnsavedChanges) {
      const confirmed = await confirm('You have unsaved changes. Really leave?')
      return confirmed
    }
    return true
  }
}
```

## Why Your Future Self Will Send You a Thank You Card 💌

1. **MVC Pattern**: Controllers handle business logic, models handle data, views handle... views. Revolutionary! 🎯

2. **Zero Learning Curve**: If you know TypeScript decorators and Vue Router, you're already 90% there. No new mental models to learn.

3. **Lazy Loading Built-in**: Your route controllers only load when needed. Bundle optimization FTW! ⚡

4. **Clean Separation**: No more spaghetti code mixing UI logic with route logic with business logic.

5. **TypeScript First**: Full type safety without jumping through hoops.

## The "But Wait, There's More!" Section 🛍️

**Multiple instances?** Easy. Use `@RouteMatcher()` for per-instance route matching:

```typescript
@Routable()
class TabController {
  constructor(private tabName: string) {}

  @RouteMatcher()
  shouldActivate(route: RouteLocation): boolean {
    return route.query.tab === this.tabName
  }
}
```

**Complex route matching?** No problem:

```typescript
@Routable(/^admin\/.*/)  // Regex support
@Routable(['products', 'offers'])  // Multiple routes
@Routable('product')  // Simple string matching
```

## The Bottom Line 📊

Vue3 Routable doesn't just solve routing problems—it makes routing so intuitive that your junior developers will actually understand your codebase. Your code reviews will be shorter, your bugs will be fewer, and your coffee breaks will be longer.

Stop fighting Vue Router and start enjoying it! 🎉

```bash
npm install vue3-routable
```

**P.S.** - Your `beforeEach` hooks called. They said they're ready for retirement. 😎

---

*Have you tried Vue3 Routable? Share your routing horror stories and victories in the comments! And if this saved you from another "where did I put that route logic?" moment, smash that ❤️ button!*

[📚 Full Documentation](https://cleverplatypus.github.io/vue3-routable) | [🐙 GitHub](https://github.com/cleverplatypus/vue3-routable)