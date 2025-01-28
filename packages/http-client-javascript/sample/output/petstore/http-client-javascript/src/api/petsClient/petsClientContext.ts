import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface PetsClientContext extends Client {}
export interface PetsClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createPetsClientContext(
  endpoint: string,
  options?: PetsClientOptions,
): PetsClientContext {
  return getClient(endpoint, { allowInsecureConnection: true, ...options });
}
