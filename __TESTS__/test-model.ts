import { reactive } from 'vue';

type TestModel = {
    isAuthenticated : boolean,
    userData?: {
        email : string
    },
    testData : {
        paramDecoratorValue? : Record<string, any>
        paths:string[]
    }
}

const model: TestModel = reactive({
    isAuthenticated : false,
    testData : {
        paths: []
    }
});

export default model