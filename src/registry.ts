import { RoutableConfig } from './types';


export const registeredClasses: Map<any, RoutableConfig> = new Map()
export const routeableObjects = new Set<Object>()

export function getRegisteredClass(key: any): RoutableConfig {
  if (!registeredClasses.has(key)) {
    registeredClasses.set(key, { activeRoutes: [] })
  }
  return registeredClasses.get(key)!
}

export function registerRoutableObject(object: Object) {
  routeableObjects.add(object)
}