import type { SQLocal } from "sqlocal";
import { getContext, setContext } from "svelte";

export class DBState {
  initState = $state<string>('no')
  syncState = $state<boolean>(false)

  dbObject = $state<undefined | SQLocal>(undefined)

  set(value:string){
    this.initState = value
  }

  get() {
    return this.initState
  }

  setSyncState(value:boolean){
    this.syncState = value
  }

  getSyncState() {
    return this.syncState
  }

  initDB(dbName: SQLocal) {
    this.dbObject = dbName
  }

  getDB() {
    return this.dbObject
  }

}
const DB_INIT_KEY = Symbol('TOAST');


export function setDBState() {
	return setContext(DB_INIT_KEY, new DBState());
}

export function getDBState() {
	return getContext<ReturnType<typeof setDBState>>(DB_INIT_KEY);
}
