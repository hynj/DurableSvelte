// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

interface Env {
  	CARDIO_STORE: DurableObjectNamespace<import("./src/index").CardioStore>;
    PasswordHasher: DurableObjectNamespace<import("./src/index").PasswordHasher>;
}

declare global {
	namespace App {
        interface Platform {
            env: Env
            cf: CfProperties
            ctx: ExecutionContext
        }
    }
}

export {};
