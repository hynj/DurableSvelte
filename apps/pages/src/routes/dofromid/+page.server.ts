import type { PageServerLoad } from './$types';
import {dev} from '$app/environment';
import { createDOProxy } from '$lib/rpcProxy';
import { fail, type Actions } from '@sveltejs/kit';


export const actions = {
	default: async (event) => {
    const { request } = event;
    const formData = await request.formData();
    console.log(formData);

    const doId = formData.get("idIn");


    const id = event.platform.env.CARDIO_STORE.idFromString(doId);
    const stub = await event.platform.env.CARDIO_STORE.get(id);

    const proxyStub = createDOProxy(stub, dev);
    const response = await proxyStub.sayHello("Bob", token);
    console.log(response);
   	return { success: true };
	}
} satisfies Actions;


export const load: PageServerLoad = async ({ request, platform }) => {

  return {
    serverMessage: "yes",
    devState: dev
  };
};



