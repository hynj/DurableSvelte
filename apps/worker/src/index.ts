import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import migrations from './../drizzle/migrations';
import { Session, userTable } from "./db/user-schema";
import { createSession, generateSessionToken } from "./auth/sessions";

export class CardioStore extends DurableObject {
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

	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
	async insert(user: typeof userTable.$inferInsert) {
        await this.db.insert(userTable).values(user);
    }
	async select() {
        return this.db.select().from(userTable);
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
