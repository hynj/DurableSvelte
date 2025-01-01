import { SQLocal } from "sqlocal";
import {SQLocalDrizzle} from "sqlocal/drizzle";
import { getContext, setContext } from "svelte";

export const db = (dbID: string) => {
  return new SQLocalDrizzle({
    databasePath: `${dbID}.sqlite3`,
    readOnly: false,
    verbose: true,
    onConnect: async () => {
      console.log("Connected");
    },
  });
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function setupTables(user: User) {
  const { batch, transaction, sql } = db(user.id);
  console.time("setupTables");
  const dateIso = new Date("2022-03-25");

  await transaction(async (tx) => [
    // Create settings KV table
  ]);
  console.timeEnd("setupTables");
}

export class DBInstance {
  _instance: SQLocal;

  constructor(dbID: string) {
    this._instance = new SQLocal({
      databasePath: `${dbID}_CardioLog.sqlite3`,
      readOnly: false,
      verbose: true,
      onConnect: async () => {
        console.log("Connected");
      },
    });
  }

  get() {
    return this._instance;
  }
}

const DB_INIT_KEY = Symbol("DBInstance");

export function setDB(dbID: string) {
  return setContext(DB_INIT_KEY, new DBInstance(dbID));
}

export function getDB() {
  return getContext<ReturnType<typeof setDB>>(DB_INIT_KEY);
}

