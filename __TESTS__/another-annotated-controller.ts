import { RouteLocation } from 'vue-router';
import { Routable, RouteActivated, GuardRouteEnter } from '../src/index.ts';
import sessionModel from './session-model.ts';

@Routable([/.*/])
export class AnotherAnnotatedController {
    
    @RouteActivated({priority : 100 })
    async activate(to:RouteLocation, from:RouteLocation) {
        sessionModel.userData = { email : 'john.doe@email.com'}
    }

}

export default new AnotherAnnotatedController();