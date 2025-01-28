import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface ListPetToysResponseClientContext extends Client {}
export interface ListPetToysResponseClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createListPetToysResponseClientContext(
  endpoint: string,
  options?: ListPetToysResponseClientOptions,
): ListPetToysResponseClientContext {
  return getClient(endpoint, { allowInsecureConnection: true, ...options });
}
