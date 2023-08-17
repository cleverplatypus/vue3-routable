import { RouteLocation } from 'vue-router';
import { Routable, RouteActivated, GuardRouteEnter, To, Param } from '../src/index.ts';
import sessionModel from './session-model.ts';

@Routable([/.*/])
export class AnotherAnnotatedController {
    
    @RouteActivated({priority : 100 })
    async activate(@To('name') name:string, @Param('param1') param1:string, @Param('param2') param2:string) {
        sessionModel.userData = { email : 'john.doe@email.com'}
        if(name === 'deep-parametrised') {
            sessionModel.testData.paramDecoratorValue = {
                param1,
                param2
            }
        }
    }

}

export default new AnotherAnnotatedController();