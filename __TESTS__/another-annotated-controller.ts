import { Param, Routable, RouteActivated, RouteWatcher, To } from '../src/index.ts';
import testModel from './test-model.ts';

@Routable([/.*/])
export class AnotherAnnotatedController {
    
    @RouteActivated({priority : 100 })
    async activate(@To('name') name:string, @Param('param1') param1:string, @Param('param2') param2:string) {
        testModel.userData = { email : 'john.doe@email.com'}
        if(name === 'deep-parametrised') {
            testModel.testData.paramDecoratorValue = {
                param1,
                param2
            }
        }
    }

    @RouteWatcher({ priority : 200, on : 'enter', match : ['basic-route', 'login-page'] })
    watchAll(@To('path') path:string) {
        testModel.testData.paths.push(path)
    }
}

export default new AnotherAnnotatedController();