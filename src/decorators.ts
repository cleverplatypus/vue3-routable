import { getRegisteredClass, registerRoutableObject } from './registry'

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
  
  export function GuardRouteEnter({priority = 0} : {priority : Number}) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const config = getRegisteredClass(target)
        config!.guardEnter = { priority, handler : (target as any)[propertyKey] }
    }
  }

  export function GuardRouteLeave({priority = 0} : {priority : Number}) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const config = getRegisteredClass(target)
        config!.guardLeave = { priority, handler : (target as any)[propertyKey] }
    }
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

  
  