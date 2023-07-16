import { reactive } from 'vue';

type SessionModel = {
    isAuthenticated : boolean,
    userData?: {
        email : string
    }
}

const model: SessionModel = reactive({
    isAuthenticated : false
});

export default model