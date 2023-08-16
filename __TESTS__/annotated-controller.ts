import { RouteLocation } from 'vue-router';
import { Routable, RouteActivated, GuardRouteEnter, To, Meta } from '../src/index.ts';
import sessionModel from './session-model.ts';
import {MiniSignal as Signal} from 'mini-signals';

const EMAILS_SIGNAL:Signal = new Signal<[string]>()

@Routable([/.*/])
export class AnnotatedController {
    
    @RouteActivated()
    async activate() {
        this.sendEmailTo(sessionModel.userData?.email as string);
    }

    @GuardRouteEnter() 
    async checkAuthentication(@Meta('requiresAuth') requiresAuth:boolean) {
        if(!requiresAuth || sessionModel.isAuthenticated) {
           return true; 
        }
        return { name : 'login-page'};
    }

    sendEmailTo(email:string) {
        EMAILS_SIGNAL.dispatch(email);
    }

    subscribeToEmailEvents(handler:(email:string) => void) {
        const binding = EMAILS_SIGNAL.add(handler);
        return () => {
            EMAILS_SIGNAL.detach(binding);
        }
    }
}

export default new AnnotatedController();