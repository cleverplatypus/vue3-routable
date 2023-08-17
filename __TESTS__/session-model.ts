import { reactive } from 'vue';

type SessionModel = {
    isAuthenticated : boolean,
    userData?: {
        email : string
    },
    testData : {
        paramDecoratorValue? : Record<string, any>
    }
}

const model: SessionModel = reactive({
    isAuthenticated : false,
    testData : {}
});

export default model