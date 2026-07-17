import { ROUTABLE_OBJECT_UUID } from './symbols';
import type { MetadataType, RoutableConfig } from './types';
export declare const registeredClasses: Map<string, RoutableConfig>;
export declare const routeableObjects: Set<object>;
export declare function getRegisteredClass(obj: any, forceCreate?: boolean): RoutableConfig;
export declare function hasRegisteredClass(obj: any): boolean;
export declare function registerRoutableObject(object: Object): void;
export declare function withRoutableObjectRegistry<T>(registry: Set<object>, callback: () => T): T;
export declare function defineMetadata(key: MetadataType, value: any, target: Object & {
    [ROUTABLE_OBJECT_UUID]?: string;
}, propertyKey: string): void;
export declare function getMetadata(key: MetadataType, target: Object & {
    [ROUTABLE_OBJECT_UUID]?: string;
}, propertyKey: string): any;
