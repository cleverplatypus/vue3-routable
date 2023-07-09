import { RouteLocation } from 'vue-router';
import { Routable, RouteActivated, GuardRouteEnter } from '../src/index.ts';
import sessionModel from './session-model.ts';

@Routable([/.*/])
export class AnnotatedController {
    
    @RouteActivated()
    async activate(to:RouteLocation, from:RouteLocation) {
        return true
    }

    @GuardRouteEnter() 
    async checkAuthentication(to:RouteLocation) {
        if(!to.meta.requiresAuth || sessionModel.isAuthenticated) {
           return true; 
        }
        return { name : 'login-page'};
    }
}

export default new AnnotatedController();