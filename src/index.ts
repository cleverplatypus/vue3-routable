import { Router, Route } from 'vue-router'


type RouteResolver = (route: Route) => boolean

type RoutableConfig = {
  activeRoutes: Array<string | RegExp | RouteResolver>
  activate?: (to: Route, from: Route) => Promise<any>
  deactivate?: (to: Route, from: Route) => Promise<any>
  update?: (to: Route, from: Route) => Promise<any>
}

const registeredClasses: Map<any, RoutableConfig> = new Map()
const routeableObjects = new Set<Object>()
function getRegisteredClass(key: any): RoutableConfig {
  if (!registeredClasses.has(key)) {
    registeredClasses.set(key, { activeRoutes: [] })
  }
  return registeredClasses.get(key)!
}

function registerRoutableObject(object: Object) {
  routeableObjects.add(object)
}

function setRoutesMetadata(flatTree: Array<Route>, parentPath = '') {
  flatTree.forEach((node) => {
    const pathName = parentPath ? `${parentPath}.${node.name}` : node.name
    node.meta = { pathName }

    if (node.children && node.children.length > 0) {
      setRoutesMetadata(node.children, pathName)
    }
  })
}

function matchesRoute(config: RoutableConfig, route: Route) {
  if (Array.isArray(config.activeRoutes)) {
    return !!config.activeRoutes.find((exp) => {
      if (exp instanceof RegExp) {
        return exp.test(route.meta?.pathName)
      } else if (typeof exp === 'string') {
        return exp === route.meta?.pathName
      } else {
        return exp(route)
      }
    })
  }
}

function handleError(promise: any, object: any, method: string) {
  if (!(promise instanceof Promise)) {
    throw new Error(`Controller ${object}.${method} must be async or return a Promise`)
  }
  return promise.catch((error) => {
    console.error(`Error in ${method} for target ${object}: ${error.message}`)
  })
}



export function Routable(arg?: Array<string | RegExp>):Function {
  return function (ctor: any) {
    const config = getRegisteredClass(ctor.prototype)
    config.activeRoutes.push(...(arg || []))
    return class extends ctor {
      constructor(...args: [any]) {
        super(...args)
        registerRoutableObject(this)
      }
    }
  }
}

export function RouteMatcher(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const config = getRegisteredClass(target)
  config!.activeRoutes.push((target as any)[propertyKey])
}

export function RouteActivated(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const config = getRegisteredClass(target)
  config!.activate = (target as any)[propertyKey]
}

export function RouteDeactivated(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const config = getRegisteredClass(target)
  config!.deactivate = (target as any)[propertyKey]
}

export function RouteUpdated(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const config = getRegisteredClass(target)
  config!.update = (target as any)[propertyKey]
}


export async function handleRouteChange(from: Route, to: Route) {
  const promises: Array<Promise<any>> = []
  Array.from(routeableObjects).forEach((routable) => {
    const key = Object.getPrototypeOf(Object.getPrototypeOf(routable))
    const config = registeredClasses.get(key)
    if (!config) {
      return
    }
    if (!matchesRoute(config!, to) && !matchesRoute(config!, from)) {
      return
    }
    if (to.name === from.name && config.update) {
      promises.push(handleError(config.update.call(routable, to, from), key.constructor.name, 'update'))
    } else if (config.activate && matchesRoute(config!, to)) {
      promises.push(handleError(config.activate.call(routable, to, from), key.constructor.name, 'activate'))
    } else if (config.deactivate) {
      promises.push(handleError(config.deactivate.call(routable, to, from), key.constructor.name, 'deactivate'))
    }
  })
  await Promise.all(promises)
}

export function registerRouter(router: Router): Router {
  setRoutesMetadata(router.getRoutes())
  return router
}

export function registerRoutableClasses(...classes:Array<any>) {
  for(const clazz of classes)
    clazz.prototype; //just poke the class in order to be loaded
}
