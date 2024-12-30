import { redirect } from "@sveltejs/kit";
import {dev} from '$app/environment';
import { createDOProxy } from "$lib/rpcProxy";

export const load = async (event) => {
 
  
  const token = event.cookies.get("session") ?? null;
  const doID = event.cookies.get("durable") ?? null;

  if (!token || !doID) {
    redirect(307, "/login");
  }

  const id = event.platform.env.CARDIO_STORE.idFromString(doID);
  const stub = await event.platform.env.CARDIO_STORE.get(id);

  const proxyStub = createDOProxy(stub, dev);

  const response = await proxyStub.isAdmin(token);

  if (response === false) {
    redirect(307, "/login");
  }

  return {
  };
};
