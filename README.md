# Vue3 Routable

## TL;DR 
You don't want to use VueX or Pinia? I hear ya! Use plain TypeScript decorated MVC controllers.

This is a simple set of decorators that work in conjuction with [vue-router](https://router.vuejs.org/) to initialise and detach objects that take care of your models, local or global, doesn't matter.

Requires TypeScript. Duh! [For now...](https://github.com/tc39/proposal-decorators) 

## Step 1
Install vue3-routable
```sh
yarn add vue3-routable
```
or
```sh
npm install vue3-routable
```

## Step 2
Annotate your controllers.

In this example we have a controller that takes care of the reactive model for a set of components in a Products list screen. They all share this component, regardless of the nested routes inside the screen.

We want to make sure that the model is in the correct state depending on the route.

> It doesn't matter what the annotated method's names are. 
```ts
import {Routable, RouteActivated, RouteDeactivated, RouteMatcher} from 'vue3-routable';
import {RouteLocation} from 'vue-router';
import {default as model, resetModel} from '@/models/products-list'
import {watch} from 'vue';
@Routable([ /^products-list/]) //this class will be registered to receive route change updates for any route whose meta.pathName (see below) starts with 'products-list'. This parameter is optional. 
export class ProductsListScreenController {
    watchers = new Set();
    /**
     * Another way to register for routes events
     */
    @RouteMatcher
    decideWhetherToBeInvolved(route:RouteLocation):boolean {
        return !route.params.someReasonNotToGetInvolved;
    }

    @RouteActivated
    async init(to:RouteLocation, from:RouteLocation) {
        if(/^products-list/.test(from.meta.pathName)) {
            //don't init the controller if navigating to a sub-route that is supposed to use the same controller
            return;   
        }
        resetModel();//set the model's initial state
        if(to.query.searchString) {
            this.loadProducts(to.query.searchString)
        }
        this.watchers.add(
            watch() => model.selectedProduct,
            () => {
                //do something
            });
    }

    @RouteDeactivated
    dispose() {
        if(/^products-list/.test(to.meta.pathName)) {
            //don't cleanup if navigating to a sub-route that is supposed to use the same controller
            return;   
        }
        //dispose of the watchers
        for(const unwatch of watchers.values()) {
            unwatch();
        }
    }

    @RouteUpdated
    updateProducts(to) {
        //parameters changed for this route so... update it
        this.loadProducts(to.query.searchString)
    }
}

export default new ProductsListScreenController();//good idea for it to be a singleton
```

### Step 3 - Minimal boilerplate code

```ts
//@/router.ts (or @/router/index.ts)

import {registerRouter} from 'vue3-routable';

//...
const router = createRouter(routes);
registerRouter(router);
```

```ts
//somewhere as early as @/main.ts
import {registerRoutableClasses} from 'vue3-routable';
import ProductsListScreenController from '@/controllers/products-list-screen-controller';

registerRoutableClasses(
    ProductsListScreenController, 
    ProductEditorController,
    SomeOtherController);
```

## Done

If your Vue3 project is properly configured to work with TypeScript, the magic is done. 

Your controllers will be activated, deactivated and updated based on the route matching rules

## Rules matching
There are two ways for the registered classes to respond to route changes:
- Via the `@Routable` parameter (`Array<string|RegExp>`)
- Via a `@RouteMatcher` annotated method (`(route:RouteLocation) => boolean`)

You can use both methods and the current route will be matched in an OR fashion, i.e. if any of the criteria is met.

<hr>
<br><br>

## Rant space
```
Disclamer: my opinion based on experience. Love Pinia? More power to you. Wrote VueX? Respect. Think I'm talking nonsense? Possible. Peace.
```

> Fair models possess data, controllers command,
And by their touch, the models' form is changed.
Views, displaying data, do receive
The UI events from users, I believe.
What's neater than this wondrous interplay,
Wherein the realm of technology holds sway? - Some William S.


I wrote this module because I'm a big fan of simplicity. And I love the benefits of an IoC ([Inversion of Control](https://medium.com/@amitkma/understanding-inversion-of-control-ioc-principle-163b1dc97454)) approach, reminiscent of my Java/ActionScript Spring days.

I think that boilerplate code and artificial constructs that depart too much from the nature of the programming language and the toolset at hand, for the sake of representing some generally laudable design pattern, are more likely to hinder programmers' productivity rather than making their life easier by virtue of solving the issues that the design pattern is meant to solve (well that was a mouthful, so much for simplicity 😆).

When it's "too much" is a matter of opinion, of course. You'll draw that line, of course.

### Branching out trains of though

I think that what happened with VueX and Pinia is that prior to v2.6, Vue basically had their model bound to the view, which made sharing state quite challenging. In fact, the only way to share state was passing props down the view chain. That's not strictly true because one could create discrete reactive objects instanciating a separate Vue object, but yeah, it wasn't ideal. So, the wondeful creativity of geeks like us came out with a solution (VueX) and (why not?) they featured a state machine (predictability is bliss), the [Immutability Pattern](https://en.wikipedia.org/wiki/Immutable_object) and, possibly [SSOT](https://en.wikipedia.org/wiki/Single_source_of_truth).

Now it's all very well. We humans observe and inherit patterns that make our lives easier (mostly). But patterns can become memes (in the Dawkins' sense) and propagate without necessarily involving much critical thinking.

Vue, in the meantime evolved and, first with v2.6's `Vue.observable`, then with Vue3's [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html), the reactivity functionality was finally exposed for your peruse. Models could be defined in any component and managed outside of the View layer. 

VueX could have been dismissed as a non necessary tool at that point. But of course, there is the sunk cost issue for the people who spent a lot of time honing it and the ones who invested their time in perfecting its usage. Fine.

### Along came Pinia
... which reminds me of that Henry Ford's quote
> If I had asked people what they wanted, they would have said faster horses.

Pinia is undoubtedly a better VueX. But do we really need VueX in the first place?

Getting to my point here. Appliying basic MVC principles and using that great and straightforward tool that Vue is, doesn't mean unsustainable development or other disasters.

The success of a final product comes from dedication, experience and craft. No tool can do the job for you. Well until ChatGPT becomes a little sharper.

Any counter-rant, feel free to insult me ad-libitum on [Discord](https://discord.gg/QH9ymrvC) 🤘 


## Test coverage
Still trying to find a good testing strategy. Stay tuned.


