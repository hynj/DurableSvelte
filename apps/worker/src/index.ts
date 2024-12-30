import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import migrations from './../drizzle/migrations';
import { Session, userTable } from "./db/user-schema";
import { createSession, generateSessionToken, validateSessionToken } from "./auth/sessions";
import { argonHash, argonVerify } from "./auth/password-functions";
import { RPCResponse } from "shared-types";

export class CardioStore extends DurableObject {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase<any>;
	passwordHasher: Fetcher;
	isDev = false;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.passwordHasher = env.PasswordHasher;
		this.isDev = (env.WORKER_ENV == "local");
	}

	async migrate() {
		console.log("migrating");
		migrate(this.db, migrations);
	}

	async createNewSession(): Promise<{ session: Session, token: string }> {
		const token = generateSessionToken();
		const userQuery = await this.db.select().from(userTable);
		const user = userQuery[0];
		const session = await createSession(token, user.id, this.db);
		return { session, token };
	}

	async login(email: string, password: string) {
		console.log(email);
		const userQuery = await this.db.select().from(userTable);
		const user = userQuery.find(u => u.email === email);
		if (!user) {
			return "Invalid email or password";
		}
		console.log(user.passwordHash);

		const checkPassword = await argonVerify(this.isDev, this.passwordHasher, user.passwordHash, password);

		if (!checkPassword) {
			return "Invalid email or password";
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id, this.db);
		return { token, session }
	}

	async sayHello(name: string, token: string): Promise<RPCResponse> {
		const { session, user } = await validateSessionToken(token, this.db);

		if (!session || !user) {
			return {
				type: "error",
				data: null,
				error: "AUTH_FAILURE"
			}
		}

		return {
			type: "success",
			data: `Hello, ${user.name}!`
		}
	}
	async insert(user: typeof userTable.$inferInsert) {
		console.log("running insert");
		// Check this is the first user
		const userQuery = await this.db.select().from(userTable);
		if (userQuery.length !== 0) {
			return {
				status: "error",
				data: { message: "User already exists" }
			};
		}

		// Insert the user
		await this.db.insert(userTable).values(user);

		// Create a new session for the user
		const { session, token } = await this.createNewSession();
		console.log(session);
		console.log(token);

		return {
			status: "success",
			data: { session, token }
		};
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
						const input = data[0] as object;
						const response = await this.insert(input);
						console.log(response);
						return new Response(JSON.stringify(response));
					case "/login":
						data = await request.json?.()
						const email = data[0] as string;
						const password = data[1] as string;
						const responseFromLogin = await this.login(email, password);
						console.log(responseFromLogin);
						return new Response(JSON.stringify(responseFromLogin));

					case "/select":
						const x = await request.json?.()
						return new Response(JSON.stringify(await this.select()));
					case "/sayHello":
						data = await request.json?.()
						console.log(data)
						console.log(typeof data)
						const name = data[0] as string;
						const token = data[1] as string;
						const responseFromSayHello = await this.sayHello(name, token);
						return new Response(JSON.stringify(responseFromSayHello));
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
