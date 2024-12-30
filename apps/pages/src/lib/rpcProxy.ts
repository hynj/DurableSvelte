import type { DurableObjectStub } from "@cloudflare/workers-types";
import type { CardioStore } from "./../../../worker/src/index"

export class DurableObjectProxy<T extends { fetch: Function }> {
  constructor(
    private stub: T,
    private isDev: boolean
  ) { }

  async invoke<K extends keyof T>(
    method: K,
    args: Parameters<T[K]> = [] as any
  ): Promise<ReturnType<T[K]>> {
    if (this.isDev) {
      const response = await this.stub.fetch(
        `http://do/${String(method)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },

          body: JSON.stringify(args)
        }
      );
      return response.text() as ReturnType<T[K]>;
    }

    return (this.stub[method] as Function)(...args);
  }
}


export function createDOProxy(stub: DurableObjectStub, isDev: boolean) {
  return new Proxy(stub, {
    get(target, prop) {
      if (prop === 'fetch') return target[prop];

      return async (...args: unknown[]) => {
        if (isDev) {
          const response = await target.fetch(`http://do/${String(prop)}`, {
            method: "POST",
            body: JSON.stringify(args)
          });
          const responseJson = await response.text();

          console.log(responseJson);
          return JSON.parse(responseJson);
        }
        return target[prop](...args);
      };
    }
  }) as DurableObjectStub & CardioStore;
}
