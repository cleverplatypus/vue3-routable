import { ROUTABLE_OBJECT_UUID } from "./symbols.ts";
import type { MetadataType, RoutableConfig } from "./types.ts";

export const registeredClasses: Map<string, RoutableConfig> = new Map();
export const routeableObjects = new Set<object>();

const metadata = new Map<MetadataType, Map<string, Map<string, any>>>();

function setObjectRoutableUUID(obj: any) {
  if (!obj[ROUTABLE_OBJECT_UUID]) {
    const uuid = crypto.randomUUID();
    Object.defineProperty(obj, ROUTABLE_OBJECT_UUID, {
      value: uuid,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
}

export function getRegisteredClass(
  obj: any,
  forceCreate: boolean = false
): RoutableConfig {
  setObjectRoutableUUID(obj);
  if (!registeredClasses.has(obj[ROUTABLE_OBJECT_UUID]) && forceCreate) {
    registeredClasses.set(obj[ROUTABLE_OBJECT_UUID], {
      activeRoutes: [],
      watchers: [],
      instanceRouteMatchers: new WeakMap(),
    });
  }
  return registeredClasses.get(obj[ROUTABLE_OBJECT_UUID])!;
}

export function registerRoutableObject(object: Object) {
  routeableObjects.add(object);
}

export function defineMetadata(
  key: MetadataType,
  value: any,
  target: Object & { [ROUTABLE_OBJECT_UUID]?: string },
  propertyKey: string
) {
  if (!metadata.has(key)) {
    metadata.set(key, new Map());
  }
  const map = metadata.get(key)!;
  setObjectRoutableUUID(target);
  const uuid = target[ROUTABLE_OBJECT_UUID]!;
  if (!map.has(uuid)) {
    map.set(uuid, new Map());
  }
  map.get(uuid)!.set(propertyKey, value);
}

export function getMetadata(
  key: MetadataType,
  target: Object & { [ROUTABLE_OBJECT_UUID]?: string },
  propertyKey: string
) {
  if (!target[ROUTABLE_OBJECT_UUID]) return null;
  if (!metadata.has(key)) {
    metadata.set(key, new Map());
  }
  const map = metadata.get(key)!;
  const uuid = target[ROUTABLE_OBJECT_UUID];
  if (!map.has(uuid)) {
    map.set(uuid, new Map());
  }
  return map.get(uuid)!.get(propertyKey);
}
