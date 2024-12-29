
import type { PageServerLoad } from './$types';
import {dev} from '$app/environment';
import { createDOProxy } from '$lib/rpcProxy';

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

export const load: PageServerLoad = async ({ request, platform }) => {
  const id = platform.env.CARDIO_STORE.idFromName(makeid(10));
  const stub = await platform.env.CARDIO_STORE.get(id);
  
  //const response = await proxy.invoke('sayHello', 'Bob');
  //const proxy = new DurableObjectProxy(stub, dev);

  const proxy2 = createDOProxy(stub, dev);
  await proxy2.migrate();

  //const response3 = await proxy2.select();
  //console.log(response3);

  return {
    serverMessage: id.toString(),
    devState: dev
  };
};


