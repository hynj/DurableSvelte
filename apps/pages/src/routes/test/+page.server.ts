import type { PageServerLoad } from './$types';
import {dev} from '$app/environment';
import { createDOProxy } from '$lib/rpcProxy';
import type { Actions } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ request, platform }) => {
  const id = platform.env.CARDIO_STORE.idFromName("foo");
  const stub = await platform.env.CARDIO_STORE.get(id);
  
  //const response = await proxy.invoke('sayHello', 'Bob');
  //const proxy = new DurableObjectProxy(stub, dev);

  const proxy2 = createDOProxy(stub, dev);
  const response2 = await proxy2.sayHello('Bob Bob');
  console.log(response2);
  //console.log(response);

  return {
    serverMessage: response2,
    devState: dev
  };
};

export const actions = {
	default: async (event) => {
    const { request } = event;
    const formData = await request.formData();
    const formObject = Object.fromEntries(formData);
    console.log(formData);

    const { email, password } = formObject;

    const id = event.platform.env.CARDIO_STORE.idFromName("foo");
    const stub = await event.platform.env.CARDIO_STORE.get(id);

    const proxyStub = createDOProxy(stub, dev);
    await proxyStub.migrate();
    const response = await proxyStub.insert();
		// TODO log the user in
	}
} satisfies Actions;
