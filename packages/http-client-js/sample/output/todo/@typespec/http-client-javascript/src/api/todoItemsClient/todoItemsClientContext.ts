import { Client, ClientOptions, KeyCredential, getClient } from "@typespec/ts-http-runtime";

export interface TodoItemsClientContext extends Client {}
export interface TodoItemsClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createTodoItemsClientContext(
  endpoint: string,
  credential: KeyCredential,
  options?: TodoItemsClientOptions,
): TodoItemsClientContext {
  return getClient(endpoint, credential, {
    ...options,
    credentials: {
      apiKeyHeaderName: "Authorization",
    },
  });
}
