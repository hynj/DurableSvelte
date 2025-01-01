import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { createDOProxy } from "$lib/rpcProxy";
import { dev } from "$app/environment";
import { handleAuthFailure } from "$lib/server/auth-utils";
import * as v from "valibot";

const AddSchema = v.object({
  name: v.pipe(
    v.string(),
    v.nonEmpty('Please enter your name.'),
    v.minLength(2, 'Your name must have 2 characters or more.'),
  ),
  content: v.pipe(
    v.string(),
    v.nonEmpty('Please enter your content.'),
    v.minLength(2, 'Your content must have 2 characters or more.'),
  ),
});

export const load: PageServerLoad = async (event) => {
  const { cookies, platform } = event;

  const token = cookies.get("session") ?? null;
  const doID = cookies.get("durable") ?? null;

  if (!token || !doID) {
    redirect(307, "/login");
  }

  if (!platform) return error(500, { message: 'Fatal error: try again later.' });

  const durableDataBase = platform.env.CARDIO_STORE;


  let notes: Array<any> | null = null;
  try {
    const id = durableDataBase.idFromString(doID);
    const stub = await durableDataBase.get(id);

    const proxyStub = createDOProxy(stub, dev);

    const response = await proxyStub.getNotes(token);

    if (response.type == "error") {
      if (response.error == "AUTH_FAILURE") { handleAuthFailure(event) }
      return error(400, response.error);
    }

    const data = response.data;
    notes = data;

    console.log(data);

  }
  catch (e) {
    console.log(e);
    return error(500, 'Fatal error: try again later.');
  }

  return {
    notes,
    devState: dev
  };
};

export const actions = {
  add: async (event) => {
    const { request, platform } = event;
    const formData = Object.fromEntries(await request.formData());
    console.log(formData);

    const result = v.safeParse(AddSchema, formData);

    const token = event.cookies.get("session") ?? null;
    const doId = event.cookies.get("durable") ?? null;

    if (!result.success) {
      console.log(result.issues);
      return fail(400, { issues: v.flatten(result.issues).nested });
    }

    const durableDataBase = platform.env.CARDIO_STORE;

    const id = durableDataBase.idFromString(doId);
    const stub = await durableDataBase.get(id);

    const proxyStub = createDOProxy(stub, dev);

    const response = await proxyStub.insertNote(result.output.name, result.output.content, token);

    if (response.type == "error") {
      if (response.error == "AUTH_FAILURE") { handleAuthFailure(event) }
      return error(400, response.error);
    }

  }
}
