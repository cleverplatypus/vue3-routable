// vue3-routable/devtools.ts

import { setupDevtoolsPlugin } from '@vue/devtools-api';
import { type App } from 'vue';
import { registeredClasses, routeableObjects } from '../registry';
import { ROUTABLE_OBJECT_UUID } from '../symbols';

const devToolsOptions = {
  routableNameResolver: (routable: any) => routable.constructor.name,
}


// Track active routable objects and their timeline
const activeRoutables = new Map<string, {
  id: string;
  instance: any;
  className: string;
  activatedAt: number;
  hooks: Array<{ name: string; timestamp: number; data: any }>;
}>();



// Timeline event emitter - this will be called from your router-handler
export const devToolsEventEmitter = {
  onRouteActivated: (instance: any, route: any) => {
    const uuid = instance[ROUTABLE_OBJECT_UUID];
    if (uuid) {
      activeRoutables.set(uuid, {
        id: uuid,
        instance,
        className: instance.constructor.name,
        activatedAt: Date.now(),
        hooks: []
      });
      
      // Emit timeline event if devtools is available
      if (globalThis.__VUE_DEVTOOLS_TIMELINE_API__) {
        globalThis.__VUE_DEVTOOLS_TIMELINE_API__.addTimelineEvent({
          layerId: 'routable-timeline',
          event: {
            time: Date.now(),
            title: 'Route Activated',
            subtitle: instance.constructor.name,
            data: { route: route.path, instance: uuid }
          }
        });
      }
      
      // Refresh inspector
      if (globalThis.__VUE_DEVTOOLS_INSPECTOR_API__) {
        globalThis.__VUE_DEVTOOLS_INSPECTOR_API__.sendInspectorTree('routable-inspector');
      }
    }
  },
  
  onRouteDeactivated: (instance: any) => {
    const uuid = instance[ROUTABLE_OBJECT_UUID];
    if (uuid) {
      activeRoutables.delete(uuid);
      
      if (globalThis.__VUE_DEVTOOLS_TIMELINE_API__) {
        globalThis.__VUE_DEVTOOLS_TIMELINE_API__.addTimelineEvent({
          layerId: 'routable-timeline',
          event: {
            time: Date.now(),
            title: 'Route Deactivated',
            subtitle: instance.constructor.name,
            data: { instance: uuid }
          }
        });
      }
      
      if (globalThis.__VUE_DEVTOOLS_INSPECTOR_API__) {
        globalThis.__VUE_DEVTOOLS_INSPECTOR_API__.sendInspectorTree('routable-inspector');
      }
    }
  },
  
  onHookCalled: (instance: any, hookName: string, data: any) => {
    const uuid = instance[ROUTABLE_OBJECT_UUID];
    if (uuid && activeRoutables.has(uuid)) {
      const routeable = activeRoutables.get(uuid)!;
      routeable.hooks.push({
        name: hookName,
        timestamp: Date.now(),
        data
      });
      
      if (globalThis.__VUE_DEVTOOLS_TIMELINE_API__) {
        globalThis.__VUE_DEVTOOLS_TIMELINE_API__.addTimelineEvent({
          layerId: 'routable-timeline',
          event: {
            time: Date.now(),
            title: `Hook: ${hookName}`,
            subtitle: instance.constructor.name,
            data: { hookName, instance: uuid, ...data }
          }
        });
      }
    }
  }
};

// Store references globally so timeline events can be emitted
declare global {
  var __VUE_DEVTOOLS_TIMELINE_API__: any;
  var __VUE_DEVTOOLS_INSPECTOR_API__: any;
  var __VUE_ROUTABLE_DEVTOOLS_EMITTER__: any;
}

// Placeholder interfaces for your internal APIs
type RoutableMeta = {
  className: string;
  file: string;
  routes: string[];
};

type ActiveInstance = {
  id: string;
  className: string;
  route: string;
  hooks: string[];
};

type DevToolsOptions = {
  routableNameResolver?: (routable: any) => string;
};

// Implement the actual functions using your registry
function getAllRoutableObjects(): object[] {
  return Array.from(routeableObjects);
}

function getMetadataForClass(uuid: string): RoutableMeta {
  const config = registeredClasses.get(uuid);
  if (!config) {
    return { className: 'Unknown', file: '', routes: [] };
  }
  
  // Find the actual instance to get class name
  const instance = Array.from(routeableObjects).find(obj => (obj as any)[ROUTABLE_OBJECT_UUID] === uuid);
  const className = instance ? (instance as any).constructor.name : 'Unknown';
  
  return {
    className,
    file: '', // TODO: Extract from metadata if you store source file info
    routes: config.activeRoutes
  };
}

function getAllRoutePatterns(): string[] {
  // TODO: Extract from your route configuration
  // This would come from your @Routable decorators and route matchers
  return [];
}

function getMappingForPattern(pattern: string): {
  className: string;
  file: string;
} {
  // TODO: Map patterns to classes
  return { className: '', file: '' };
}

function getActiveRoutables(): ActiveInstance[] {
  return Array.from(activeRoutables.values()).map(routeable => ({
    id: routeable.id,
    className: routeable.className,
    route: '', // TODO: Extract current route
    hooks: routeable.hooks.map(h => h.name)
  }));
}

export function enableRoutableDevtools(app: App, options?: DevToolsOptions) {
  if (typeof window === 'undefined') return;

  if(options) {
    Object.assign(devToolsOptions, options);
  }

  // Set global reference for router handler integration
  globalThis.__VUE_ROUTABLE_DEVTOOLS_EMITTER__ = devToolsEventEmitter;

  setupDevtoolsPlugin(
    {
      id: 'cleverplatypus.vue3-routable',
      label: 'Vue3 Routable',
      logo: 'https://cleverplatypus.github.io/vue3-routable/images/logo.svg',
      packageName: 'vue3-routable',
      homepage: 'https://github.com/cleverplatypus/vue3-routable',
      app,
    },
    (api) => {
      // Store API references globally for timeline events
      globalThis.__VUE_DEVTOOLS_TIMELINE_API__ = api;
      globalThis.__VUE_DEVTOOLS_INSPECTOR_API__ = api;


      // Register the inspector - THIS WAS MISSING!
      api.addInspector({
        id: 'routable-inspector',
        label: 'Vue3 Routable',
        icon: 'storage', // Material Design icon - becomes custom-ic-baseline-alt-route
        treeFilterPlaceholder: 'Search routable objects...'
      });

      api.on.getInspectorTree((payload) => {
        if (payload.inspectorId !== 'routable-inspector') return;

        payload.rootNodes = [
          {
            id: 'classes',
            label: 'Registered Classes',
            children: Array.from(registeredClasses.keys()).map((uuid) => {
              const meta = getMetadataForClass(uuid);
              return {
                id: uuid, // Use UUID directly
                label: meta.className,
                tags: [{
                  label: `${meta.routes.length} routes`,
                  textColor: 0x000000,
                  backgroundColor: 0x42b983
                }]
              };
            }),
          },
          {
            id: 'active',
            label: 'Active Instances',
            children: Array.from(activeRoutables.values()).map((routeable) => ({
              id: `active-${routeable.id}`,
              label: routeable.className,
              tags: [{
                label: `${routeable.hooks.length} hooks`,
                textColor: 0x000000,
                backgroundColor: 0xff6b6b
              }]
            })),
          },
        ];
      });

      api.on.getInspectorState((payload) => {
        if (payload.inspectorId !== 'routable-inspector') return;

        const nodeId = payload.nodeId;

        // Handle registered class nodes (using UUID directly)
        if (registeredClasses.has(nodeId)) {
          const meta = getMetadataForClass(nodeId);
          const config = registeredClasses.get(nodeId)!;
          
          payload.state = {
            'Class Info': [
              { key: 'Name', value: meta.className },
              { key: 'Active Routes', value: config.activeRoutes.join(', ') || 'None' },
              { key: 'Watchers', value: config.watchers.length.toString() },
            ],
            'Configuration': [
              { key: 'Instance Matchers', value: 'WeakMap with route matchers' },
            ]
          };
        } 
        // Handle active instance nodes
        else if (nodeId.startsWith('active-')) {
          const id = nodeId.slice(7);
          const routeable = activeRoutables.get(id);
          if (routeable) {
            payload.state = {
              'Instance Info': [
                { key: 'Class', value: routeable.className },
                { key: 'UUID', value: routeable.id },
                { key: 'Activated At', value: new Date(routeable.activatedAt).toLocaleString() },
              ],
              'Hook Timeline': routeable.hooks.map((hook, index) => ({
                key: `${index + 1}. ${hook.name}`,
                value: new Date(hook.timestamp).toLocaleTimeString(),
                editable: false
              }))
            };
          }
        }
      });

      // Add timeline layer
      api.addTimelineLayer({
        id: 'routable-timeline',
        label: 'Routable Lifecycle',
        color: 0x42b983,
      });

      // The timeline events are now emitted via devToolsEventEmitter
      // You need to integrate this with your router-handler.ts
    }
  );
}
