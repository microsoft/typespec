import { Client, ClientOptions, KeyCredential, getClient } from "@typespec/ts-http-runtime";

export interface TodoClientContext extends Client {}
export interface TodoClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createTodoClientContext(
  endpoint: string,
  credential: KeyCredential,
  options?: TodoClientOptions,
): TodoClientContext {
  return getClient(endpoint, credential, {
    ...options,
    credentials: {
      apiKeyHeaderName: "Authorization",
    },
  });
}
