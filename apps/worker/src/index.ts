import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import migrations from './../drizzle/migrations';
import { Session, userTable } from "./db/user-schema";
import { createSession, generateSessionToken } from "./auth/sessions";


/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class CardioStore extends DurableObject {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.toml
	 */
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase<any>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
	}
	 async migrate() {
        migrate(this.db, migrations);
    }

	async createNewSession(): Promise<Session> {
		const token = generateSessionToken();
		const userQuery = await this.db.select().from(userTable);
		const user = userQuery[0];
		const session = await createSession(token, user.id, this.db);
		return session;
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
	async insert(user: typeof users.$inferInsert) {
        await this.db.insert(users).values(user);
    }
	async select() {
        return this.db.select().from(users);
    }


	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		let data: Array<unknown>;

		switch (request.method) {
			case "GET":
				return new Response("Bad Request", { status: 400 });
			case "POST":
				switch (url.pathname) {
					case "/migrate":
						return new Response(await this.migrate());
					case "/insert":
						data = await request.json?.()
						console.log(data)
						console.log(typeof data)
						const input = data[0] as object;
						return new Response(await this.insert(input));
					case "/select":
						const x = await request.json?.()
						return new Response(JSON.stringify(await this.select()));
					case "/sayHello":
						data = await request.json?.()
						console.log(data)
						console.log(typeof data)
						const name = data[0] as string;
						return new Response(await this.sayHello(name));
					default:
						return new Response("Bad Request", { status: 400 });
				}
			default:
				return new Response("Bad Request", { status: 400 });
		}
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.toml
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		// We will create a `DurableObjectId` using the pathname from the Worker request
		// This id refers to a unique instance of our 'MyDurableObject' class above
		let id: DurableObjectId = env.CARDIO_STORE.idFromName(new URL(request.url).pathname);

		// This stub creates a communication channel with the Durable Object instance
		// The Durable Object constructor will be invoked upon the first call for a given id
		let stub = env.CARDIO_STORE.get(id);

		// We call the `sayHello()` RPC method on the stub to invoke the method on the remote
		// Durable Object instance
		let greeting = await stub.sayHello("world");

		return new Response(greeting);
	},
} satisfies ExportedHandler<Env>;
