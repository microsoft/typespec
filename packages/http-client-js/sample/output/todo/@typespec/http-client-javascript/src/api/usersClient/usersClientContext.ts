import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface UsersClientContext extends Client {}
export interface UsersClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createUsersClientContext(
  endpoint: string,
  options?: UsersClientOptions,
): UsersClientContext {
  return getClient(endpoint, {
    ...options,
  });
}
