import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { createDOProxy } from '$lib/rpcProxy';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { handleAuthFailure } from '$lib/server/auth-utils';

export const actions = {
  default: async (event) => {
    const { request } = event;
    const formData = await request.formData();
    console.log(formData);

    const token = event.cookies.get("session") ?? null;
    const doId = event.cookies.get("durable") ?? null;

    if (!token || !doId) {
      return fail(400, { message: "Invalid session" });
    }

    const id = event.platform.env.CARDIO_STORE.idFromString(doId);
    const stub = await event.platform.env.CARDIO_STORE.get(id);

    const proxyStub = createDOProxy(stub, dev);
    const response = await proxyStub.sayHello("Bob", token);

    if (response.type == "error") {
      if (response.error == "AUTH_FAILURE") { handleAuthFailure(event) }
      return fail(400, { message: response.error });
    }

    const data = response.data as string;

    console.log(data);
    return { success: true };
  }
} satisfies Actions;


export const load: PageServerLoad = async (event) => {

  const { cookies, platform } = event;

  const token = cookies.get("session") ?? null;
  const doID = cookies.get("durable") ?? null;

  if (!token || !doID) {
    redirect(307, "/login");
  }

  if (!platform) return fail(500, { message: 'Fatal error: try again later.' });

  const durableDataBase = platform.env.CARDIO_STORE;

  let message: string | null = null;

  try {
    const id = durableDataBase.idFromString(doID);
    const stub = await durableDataBase.get(id);

    const proxyStub = createDOProxy(stub, dev);

    const response = await proxyStub.sayHello("Bob", token);

        if (response.type == "error") {
      if (response.error == "AUTH_FAILURE") { handleAuthFailure(event) }
      return fail(400, { message: response.error });
    }

    const data = response.data as string;
    message = data;

    console.log(data);

  }
  catch (e) {
    console.log(e);
    return fail(500, { message: 'Fatal error: try again later.' });
  }

  return {
    serverMessage: message,
    devState: dev
  };
};
