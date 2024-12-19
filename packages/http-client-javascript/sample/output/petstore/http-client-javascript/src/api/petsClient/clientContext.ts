import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface PetsClientContext extends Client {}
export interface PetsClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createPetsClientContext(endpoint: string): PetsClientContext {
  return getClient(endpoint, { allowInsecureConnection: true });
}
