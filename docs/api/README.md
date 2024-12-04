**vue3-routable**

***

# Vue3 Routable

![Tests](https://github.com/cleverplatypus/vue3-routable/actions/workflows/test.yml/badge.svg)

## TL;DR

You don't want to use VueX or Pinia? I hear ya! Use plain TypeScript decorated MVC controllers.

This is a simple set of decorators that work in conjuction with [vue-router](https://router.vuejs.org/) to initialise and detach objects that take care of your models, local or global, doesn't matter.

Requires TypeScript. Duh! [For now...](https://github.com/tc39/proposal-decorators).

## Step 1

Install vue3-routable

```sh
yarn add vue3-routable
```

or

```sh
npm install vue3-routable
```

You might have to add this to your `tsconfig.json`

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## Step 2

Annotate your controllers.

In this example we have a controller that takes care of the reactive model for a set of components in a Products list screen. They all share this component, regardless of the nested routes inside the screen.

We want to make sure that the model is in the correct state depending on the route.

> It doesn't matter what the annotated method's names are.

```ts
// @/controllers/products-list-controller.ts

import {Routable, Query, RouteActivated, RouteDeactivated, RouteMatcher} from 'vue3-routable';
import {RouteLocation} from 'vue-router';
import {default as model, resetModel} from '@/models/products-list'
import {watch} from 'vue';

/**
 * this class will be registered to receive route
 * change updates for any route whose meta.pathName
 * (see below) starts with 'products-list'.
 * The parameter is optional.
 */
@Routable(/^products-list/)
export class ProductsListScreenController {
   #watchers = new Set<Function>();
    /**
     * Another way to register for routes events
     */
    @RouteMatcher
    decideWhetherToBeInvolved(route:RouteLocation):boolean {
        return !route.params.someReasonNotToGetInvolved;
    }

    @RouteActivated({priority : 10})
    async init(@Query('searchString') searchString:string) {
        if(/^products-list/.test(from.meta.pathName)) {
            //don't init the controller if navigating to a sub-route that is supposed to use the same controller
            return;
        }
        resetModel();//set the model's initial state
        if(searchString) {
            this.loadProducts(searchString)
        }
        this.watchers.add(
            watch() => model.selectedProduct,
            () => {
                //do something
            });
    }

    @RouteDeactivated()
    async cleanUp() {
        if(/^products-list/.test(to.meta.pathName)) {
            //don't cleanup if navigating to a sub-route that is supposed to use the same controller
            return;
        }
        //dispose of the watchers
        for(const unwatch of this.watchers.values()) {
            unwatch();
        }
    }

    @RouteUpdated()
    async updateProducts(@Query('searchString') searchString:string) {
        //parameters changed for this route so... update it
        this.loadProducts(searchString)
    }

    @GuardRouteLeave()
    async refuseLeaveIfUnsavedData() {
        if(model.hasUnsavedData) {
            alert('Please save or discard the changes before leaving');
            return;
        }
        return true;
    }

    @RouteWatcher(/product/)
    watchAllProductRelatedRouteChanges(@To('path') pagePath:string) {
        productPagesAudit.add(pagePath)
    }
}

export default new ProductsListScreenController();//good idea for it to be a singleton
```

```ts
// @/controllers/session-controller
import { Meta, Routable, GuardRouteEnter } from 'vue3-routable';

@Routable(/.*/)
export class SessionController {
  @GuardRouteEnter({ priority: 1000 })
  async checkRole(
    @Meta('noAuthRequired') noAuthRequired: boolean,
    @Meta('requiredRole') requiredRole?: string
  ) {
    if (noAuthRequired) {
      return;
    }

    if (!this.isUserAuthenticated()) {
      return { name: 'sign-in' };
    }

    if (requiredRole && !this.getUserRoles().includes(requiredRole)) {
      return { name: 'home' };
    }
  }

  //... session related methods
}

export default new SessionController();
```

### Step 3 - Minimal boilerplate code

```ts
//@/router.ts (or @/router/index.ts)

import { registerRouter } from 'vue3-routable';

//...
const router = createRouter(routes);
registerRouter(router);
```

```ts
//somewhere as early as @/main.ts
import { registerRoutableClasses } from 'vue3-routable';
import ProductsListScreenController from '@/controllers/products-list-screen-controller';
import SessionController from '@/controllers/session-controller';

registerRoutableClasses(ProductsListScreenController, SessionController);
```

## Done

If your Vue3 project is properly configured to work with TypeScript, the magic is done.

Your controllers will be activated, deactivated and updated based on the route matching rules

## Rules matching

There are two ways for the registered classes to respond to route changes:

- Via the `@Routable` parameter (`string|RegExp|(route:RouteLocation) => boolean | Array<string|RegExp|(route:RouteLocation) => boolean>`)
- Via a `@RouteMatcher` annotated method (`(route:RouteLocation) => boolean`)

You can use both methods and the current route will be matched in an OR fashion, i.e. if any of the criteria is met.

## `meta.pathName`

The module will add the `meta.pathName` property to your routes. Its value will be a concatenation of `route.name` with it's children's `route.name`.

So, for instance, for a product editor's (`name : 'product-editor-screen'`) nested route for editing the product image (`name : 'product-image-editor'`), you'll have `meta.pathName : 'product-editor-screen.product-image-editor`.

The `meta.pathName` property is used to match against the `@Routable` arguments.

## Route Handlers

**Important**: methods annotated with the `@RouteActivated`, `@RouteDeactivated`. `@RouteUpdated`, `GuardRouteEnter` and `GuardRouteLeave` must by either declared `async` or return a `Promise` or the app will fail at class-registration time.
<br><br>

## Route Watchers
`@RouteWatcher(config:RouteWatcherConfig)` can be used to observe route changes,

The class still needs to be annotated with `@Routable(matcher)` but no further handlers/guards need to be declared.

Watchers are called if the routable class is active.

```ts
type RouteHandlerEventType = 'enter' | 'leave' | 'update';

type RouteWatcherConfig = {
  priority?: number;
  match?: RouteMatchExpression;
  on? : Array<RouteHandlerEventType> | RouteHandlerEventType;
}
```
All watcher configuration parameters are optional. If none are set the watcher will be called every time a route changes and the `@Routable()` class matcher pattern matches.

Parameters injectors can be used as usual.

```ts

@Routable(/.*/)
class Auditor {
    @RouteWatcher({match : 'product-page', priority : 0})
    productPageAuditor(@Param('productId') productId:string ) {
        if(productId) //watchers are called both on enter/exit route
            audit.productVisited(productId);
    }
    
    @RouteWatcher({ match : 'help-page' })
    helpPageSpy(@Query('topic-search') topicSearch:string) {
        if(topicSearch) 
            audit.addRequestedSearchTopic(searchTopic);
    }
}
```

## Parameter Injectors

`vue3-routable` provides param decorators to inject route handlers with route information. This makes the code more readable and adds some nice abstraction over the router's inner workings.

### `@Param(name?:string)`

Injects the `to` route's named param.

```ts
// Route path /products/:productId
// https://mystore.com/products/78439784395
@RouteActivated()
activate(@Param('productId') productId:string) {
    this.loadProduct(productId); //<-- '78439784395'
}
```

### `@Query(name?:string)`

Injects the `to` route's named search query param.

```ts
// Route path /products
// https://mystore.com/products?search-for=bananas
@RouteActivated()
activate(@Query('search-for') searchFor:string) {
    this.findProducts(searchFor); //<-- 'bananas'
}
```

### `@Meta(path?:string)`

Injects the `to` route's meta property (deep).

```ts
@GuardRouteEnter({priority:1000})
beforeEnter(@Meta('requirements.user_privileges') privileges:Array<string>) {
    if(!sessionController.userHasPrivileges(privileges)) {
        return {name : 'unauthorised'};
    }
}
```

> To inject `query`, `param` and `meta` from the `from` route, use `@From('property.path')`

### `@To(path?:string)` and `@From(path?:string)`

Injects the `to` and `from` routes or their (deep) property

```ts
@RouteActivated({)
activate(
    @To() to:RouteLocation,
    @To('name') toName:string) {
    console.log(`Landing to route path ${to.path} named ${toName}`);
}
```

```ts
@RouteActivated()
activate(
    @From('name') fromRouteName:string,
    @From('meta.foo') fromFoo:string
    ) {
    console.log(`Coming from route name ${fromRouteName} that has a meta foo=${fromFoo}`);
}
```

## Motivation benind this module

> **Disclamer**: opinion based on my experience.<br>
> Love Pinia? More power to you. Wrote VueX? Respect.<br>
> Think I'm talking nonsense? Possible. Peace.<br><br>

I wrote this module because I'm a big fan of Vue's simplicity and of simplicity in general. And I love the IoC ([Inversion of Control](https://medium.com/@amitkma/understanding-inversion-of-control-ioc-principle-163b1dc97454)) approach, reminiscent of my Java/ActionScript Spring days.

I think that boilerplate code and artificial constructs that depart too much from the nature of the programming language and the toolset at hand, for the sake of representing some generally laudable design pattern, are more likely to hinder programmers' productivity rather than making their life easier by virtue of solving the issues that the design pattern is meant to solve.

When it's "too much" is a matter of opinion, of course. You'll draw that line.

Reading through the documentation and motivation behind VueX and Pinia, it might seem like the only two available options when writing Vue apps were:

- having all the business logic in the vue components and having to deal with difficult passing down props
- using VueX/Pinia stores

I don't think this is a correct assumption. Models can live and be referenced from outside view components since Vue v2.6 and the logic can be separated simply by applying general MVC principles.

Besides, from what I've seen in apps using VueX/Pinia out there, there is still too much code in view components and store files are a mix of data and behaviour.

Sure, there are quirks associated with using reactive objects directly, and, without the necessary understanding of how they work, one can end up with unexpected and hard to debug side effects. But hey, get to know your tools instead of dumping the issue on yet another tool, right?

## Test coverage

The current tests are based on a mock implementation of vue-router that mimicks the effects of route navigation on routable objects. That's to avoid having to rely on heavy virtual DOM libraries.

## Feedback

Any counter-rant, suggestions, insults, feel free to contact me on [Discord](https://discord.gg/QH9ymrvC) ✌🏻
