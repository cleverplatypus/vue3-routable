import { ROUTABLE_OBJECT_UUID } from './symbols';
export const registeredClasses = new Map();
export const routeableObjects = new Set();
let activeRoutableRegistry;
const metadata = new Map();
function setObjectRoutableUUID(obj) {
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
export function getRegisteredClass(obj, forceCreate = false) {
    setObjectRoutableUUID(obj);
    if (!registeredClasses.has(obj[ROUTABLE_OBJECT_UUID]) && forceCreate) {
        registeredClasses.set(obj[ROUTABLE_OBJECT_UUID], {
            activeRoutes: [],
            watchers: [],
            instanceRouteMatchers: new WeakMap(),
        });
    }
    return registeredClasses.get(obj[ROUTABLE_OBJECT_UUID]);
}
export function hasRegisteredClass(obj) {
    if (!obj)
        return false;
    setObjectRoutableUUID(obj);
    return registeredClasses.has(obj[ROUTABLE_OBJECT_UUID]);
}
export function registerRoutableObject(object) {
    (activeRoutableRegistry || routeableObjects).add(object);
}
export function withRoutableObjectRegistry(registry, callback) {
    const previousRegistry = activeRoutableRegistry;
    activeRoutableRegistry = registry;
    try {
        return callback();
    }
    finally {
        activeRoutableRegistry = previousRegistry;
    }
}
export function defineMetadata(key, value, target, propertyKey) {
    if (!metadata.has(key)) {
        metadata.set(key, new Map());
    }
    const map = metadata.get(key);
    setObjectRoutableUUID(target);
    const uuid = target[ROUTABLE_OBJECT_UUID];
    if (!map.has(uuid)) {
        map.set(uuid, new Map());
    }
    map.get(uuid).set(propertyKey, value);
}
export function getMetadata(key, target, propertyKey) {
    if (!target[ROUTABLE_OBJECT_UUID])
        return null;
    if (!metadata.has(key)) {
        metadata.set(key, new Map());
    }
    const map = metadata.get(key);
    const uuid = target[ROUTABLE_OBJECT_UUID];
    if (!map.has(uuid)) {
        map.set(uuid, new Map());
    }
    return map.get(uuid).get(propertyKey);
}
