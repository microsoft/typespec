import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface TodoItemsClientContext extends Client {}
export interface TodoItemsClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createTodoItemsClientContext(
  endpoint: string,
  options?: TodoItemsClientOptions,
): TodoItemsClientContext {
  return getClient(endpoint, { allowInsecureConnection: true, ...options });
}
