import { ComponentContext, createContext, useContext } from "@alloy-js/core";
import { Namespace } from "@typespec/compiler";

export interface ClientLibrary {
  scope: string;
  rootNs: Namespace;
}

export const ClientLibraryContext: ComponentContext<ClientLibrary> = createContext<ClientLibrary>();

export function useClientLibraryContext() {
  return useContext(ClientLibraryContext)!;
}
