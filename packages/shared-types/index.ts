export interface myType {
  id: string
}

export type RPCResponse  = {
  type: "success" | "error"
  data: any
  error?: "AUTH_FAILURE"
}
