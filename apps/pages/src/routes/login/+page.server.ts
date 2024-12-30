import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { createDOProxy } from '$lib/rpcProxy';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import * as v from 'valibot'
import { setSessionAndDurableCookie } from '$lib/server/auth-utils';

const LoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty('Please enter your email.'),
    v.email('The email address is badly formatted.'),
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty('Please enter your password.'),
    v.minLength(8, 'Your password must have 8 characters or more.'),
  )
});


export const actions = {
  default: async (event) => {
    const { request } = event;
    const formData = Object.fromEntries(await request.formData());
    console.log(formData);

    const result = v.safeParse(LoginSchema, formData);

    const token = event.cookies.get("session") ?? null;
    const doId = event.cookies.get("durable") ?? null;

    if (!result.success) {
      console.log(result.issues);
      return fail(400, { issues: v.flatten(result.issues).nested });
    }

    let doID: string | null = null;
    try {
      doID = await event.platform.env.CARDIO_DO_LOGIN.get(result.output.email);
    }
    catch (e) {
      console.log(e);
      return fail(500, { message: 'Fatal error: try again later.' });
    }

    try {
      const id = event.platform.env.CARDIO_STORE.idFromString(doID);
      console.log(id);
      const stub = await event.platform.env.CARDIO_STORE.get(id);
      const proxyStub = createDOProxy(stub, dev);


      const loginResponse = await proxyStub.login(result.output.email, result.output.password);
      await proxyStub.migrate();

      if (loginResponse === "Invalid email or password") {
        return fail(400, { message: 'Invalid email or password.' });
      }

      console.log(loginResponse);

      const { session, token } = loginResponse;


      setSessionAndDurableCookie(event, token, doID, new Date(session.expiresAt))

      redirect(307, "/coldstart");

    }
    catch (e) {
      console.log(e);
      return fail(500, { message: 'Fatal error: try again later.' });
    }

    return { success: true };
  }
} satisfies Actions;


export const load: PageServerLoad = async ({ request, platform }) => {

  return {
    serverMessage: "yes",
    devState: dev
  };
};



