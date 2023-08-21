import type { MetadataType, RoutableConfig } from './types.ts';

export const registeredClasses: Map<any, RoutableConfig> = new Map()
export const routeableObjects = new Set<object>()

const metadata = new Map<MetadataType, Map<Object, Map<string, any>>>();

export function getRegisteredClass(key: any): RoutableConfig {
  if (!registeredClasses.has(key)) {
    registeredClasses.set(key, { activeRoutes: [], isActive: false, watchers: [] })
  }
  return registeredClasses.get(key)!
}

export function registerRoutableObject(object: Object) {
  routeableObjects.add(object)
}

export function getActiveRoutablesConfigs() {
  return Array.from(routeableObjects)
    .map(obj => ({ 
      target : obj, 
      config: getRegisteredClass(Object.getPrototypeOf(obj))
    }))
    .filter(obj => obj.config.isActive);
}

export function defineMetadata(key: MetadataType, value: any, target: Object, propertyKey: string) {
  if (!metadata.has(key)) {
    metadata.set(key, new Map())
  }
  const map = metadata.get(key)!
  if (!map.has(target)) {
    map.set(target, new Map())
  }
  map.get(target)!.set(propertyKey, value)  
}

export function getMetadata(key: MetadataType, target: Object, propertyKey: string) {
  if (!metadata.has(key)) {
    metadata.set(key, new Map())
  }
  const map = metadata.get(key)!
  if (!map.has(target)) {
    map.set(target, new Map())
  }
  return map.get(target)!.get(propertyKey)
}
  
