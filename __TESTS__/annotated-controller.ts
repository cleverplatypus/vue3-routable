import { MiniSignal as Signal } from 'mini-signals';
import { GuardRouteEnter, Meta, Routable, RouteActivated } from '../src/index.ts';
import testModel from './test-model.ts';

const EMAILS_SIGNAL:Signal = new Signal<[string]>()

@Routable([/.*/])
export class AnnotatedController {
    
    @RouteActivated()
    async activate() {
        this.sendEmailTo(testModel.userData?.email as string);
    }

    @GuardRouteEnter() 
    async checkAuthentication(@Meta('requiresAuth') requiresAuth:boolean) {
        if(!requiresAuth || testModel.isAuthenticated) {
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