import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import * as v from 'valibot'
import { dev } from '$app/environment';
import { createDOProxy } from '$lib/rpcProxy';
import { argonHash } from '$lib/server/pass-hash';
import { setSessionAndDurableCookie, setSessionTokenCookie } from '$lib/server/auth-utils';
import type { Session } from '../../../../worker/src/db/user-schema';

const RegisterSchema = v.pipe(
  v.object({
    email: v.pipe(
      v.string(),
      v.nonEmpty('Please enter your email.'),
      v.email('The email address is badly formatted.'),
    ),
    name: v.pipe(
      v.string(),
      v.nonEmpty('Please enter your name.'),
      v.minLength(2, 'Your name must have 2 characters or more.'),
    ),
    password: v.pipe(
      v.string(),
      v.nonEmpty('Please enter your password.'),
      v.minLength(8, 'Your password must have 8 characters or more.'),
    ),
    confirmPassword: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'The two passwords do not match.',
    ),
    ['confirmPassword'],
  ),
);


export const actions = {
  default: async (event) => {
    const { request, platform } = event;
    const formData = Object.fromEntries(await request.formData());
    if (!platform) return fail(500, { message: 'Fatal error: try again later.' });

    // Validate form data
    const result = v.safeParse(RegisterSchema, formData);

    if (!result.success) {
      console.log(result.issues);
      return fail(400, { issues: v.flatten(result.issues).nested });
    }

    const { email, name, password } = result.output;

    const hasEmail = await platform.env.CARDIO_DO_LOGIN.get(email);

    if (hasEmail != null) {
      console.log("Email already in use");
      return fail(400, { message: 'Email already exists.' });
    }

    const hashedPassword = await argonHash(platform, password);
    if (!hashedPassword) return fail(500, { message: 'Fatal error: try again later.' });
  
    // NEED TO REMOVE THIS!!!!
    let role = "user";
    if (email === "thenick112@gmail.com") {
      role = "admin";
    }

    const newUserInput = { email, name, passwordHash: hashedPassword, recoveryCode: "awdawd",role };

    const newDOid = await platform.env.CARDIO_STORE.newUniqueId();
    console.log(newDOid.toString());

    let sessionToken: string | null = null;
    let session: Session | null = null;

    try {
      const newDO = await platform.env.CARDIO_STORE.get(newDOid);
      const newDOProxy = createDOProxy(newDO, dev);
      await newDOProxy.migrate();
      const insertResponse = await newDOProxy.insert(newUserInput);

      console.log(insertResponse);

      if (insertResponse.status === "error") {
        console.log(insertResponse.data.message);
        return fail(500, { message: 'Fatal error: try again later.' });
      }

      console.log(insertResponse.status);
      session = insertResponse.data.session;
      sessionToken = insertResponse.data.token;

      console.log(session);
      console.log(sessionToken);

      if (!session || !sessionToken) {
        console.log("session or token is null");
        return fail(500, { message: 'Fatal error: try again later.' });
      }

    }
    catch (e) {
      console.log(e);
      return fail(500, { message: 'Fatal error: try again later.' });
    }
    try {
      const insert = await platform.env.CARDIO_DO_LOGIN.put(email, newDOid.toString())
    }
    catch (e) {
      console.log(e);
      return fail(500, { message: 'Fatal error: try again later.' });
    }

    setSessionAndDurableCookie(event, sessionToken, newDOid.toString(), new Date(session.expiresAt))
    redirect(307, "/coldstart");
    
    return { success: true };

  }
} satisfies Actions;
