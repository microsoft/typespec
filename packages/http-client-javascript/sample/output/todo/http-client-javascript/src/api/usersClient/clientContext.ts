import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface UsersClientContext extends Client {}
export interface UsersClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createUsersClientContext(endpoint: string): UsersClientContext {
  return getClient(endpoint, { allowInsecureConnection: true });
}
