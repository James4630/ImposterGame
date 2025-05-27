export interface RequestMessage {
  type: "request";
  resource: string;
  name: string,
  payload?: unknown;
}

export interface ResponseMessage {
  type: "response";
  resource: string;
  status: "success" | "error";
  data?: unknown;
  error?: string;
}
