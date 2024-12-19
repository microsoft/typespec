import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface ListPetToysResponseClientContext extends Client {}
export interface ListPetToysResponseClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createListPetToysResponseClientContext(
  endpoint: string,
): ListPetToysResponseClientContext {
  return getClient(endpoint, { allowInsecureConnection: true });
}
