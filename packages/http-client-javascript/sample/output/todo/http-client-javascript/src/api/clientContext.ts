import { Client, ClientOptions, KeyCredential, getClient } from "@typespec/ts-http-runtime";

export interface TodoClientContext extends Client {}
export interface TodoClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createTodoClientContext(
  endpoint: string,
  credential: KeyCredential | KeyCredential,
  options?: TodoClientOptions,
): TodoClientContext {
  return getClient(endpoint, credential, { allowInsecureConnection: true, ...options });
}
