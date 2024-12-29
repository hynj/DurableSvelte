
import type { PageServerLoad } from './$types';
import {dev} from '$app/environment';
import { createDOProxy } from '$lib/rpcProxy';
import type { Actions } from '@sveltejs/kit';


export const actions = {
	default: async (event) => {
    const { request } = event;
    const formData = await request.formData();
    const formObject = Object.fromEntries(formData);
    console.log(formData);

    const { idIn } = formObject;

    const id = event.platform.env.CARDIO_STORE.idFromString(idIn);
    const stub = await event.platform.env.CARDIO_STORE.get(id);

    const proxyStub = createDOProxy(stub, dev);
    const response = await proxyStub.sayHello(idIn);
		// TODO log the user in
   	return { success: true };
	}
} satisfies Actions;


export const load: PageServerLoad = async ({ request, platform }) => {

  return {
    serverMessage: "yes",
    devState: dev
  };
};



