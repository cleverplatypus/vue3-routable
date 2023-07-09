import isEqual from 'lodash.isequal';

import { RouteLocation, RouteLocationNamedRaw, RouteLocationRaw } from 'vue-router';
import {RouteChangeHandler} from '../src/types.ts';



function rawToLocation(raw:RouteLocationNamedRaw) : RouteLocation {
    return Object.assign({
        path : `/${String(raw.name)}`,
        matched : [],
        meta : {},
        fullPath: '',
        query: null,
        hash: '',
        redirectedFrom : null
        }, raw as RouteLocationNamedRaw);
    }


class FakeRouter {
   #config:any
   #currentRoute?:RouteLocation;
   #beforeEachHandler?:RouteChangeHandler;
   #routes:Array<RouteLocation>

    constructor(config:any) {
        this.#routes = config.routes.map((r:RouteLocationNamedRaw) => rawToLocation(r));
        const root = this.#routes.find(r => r.path === '/')!;
        this.#currentRoute = root;
    }

    async push(to:RouteLocationNamedRaw) : Promise<any> {
        const toRoute:RouteLocation = this.#routes.find((r:RouteLocation) => r.name === to.name!)!
        const result = await this.#beforeEachHandler!(toRoute, this.#currentRoute);
        if(result === true) {
            this.#currentRoute = toRoute;
            return;
        }
        if(result as RouteLocationRaw && !isEqual(result, this.#currentRoute)) {
            return await this.push(result as RouteLocationNamedRaw);
        } else {
            //route change canceled
            return false
        }
    }

    beforeEach(fn:() => any) {
        this.#beforeEachHandler = fn;
    }

    get currentRoute() {
        return this.#currentRoute!;
    }

    getRoutes() {
        return this.#routes;
    }
}


export default function createFakeRouter(config:any) {    
    return new FakeRouter(config);
}