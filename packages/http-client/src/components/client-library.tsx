import { type Children } from "@alloy-js/core";
import { Program } from "@typespec/compiler";
import { createClientLibrary } from "../client-library.js";
import { ResolveClientsOptions } from "../client-resolution.js";
import { ClientLibraryContext } from "../context/client-library-context.js";

export interface ClientLibraryProps {
  clientResolutionOptions?: ResolveClientsOptions;
  program: Program;
  children?: Children;
}

export function ClientLibrary(props: ClientLibraryProps) {
  const clientLibrary = createClientLibrary(props.program, {
    clientResolution: props.clientResolutionOptions,
  });
  return (
    <ClientLibraryContext.Provider value={clientLibrary}>
      {props.children}
    </ClientLibraryContext.Provider>
  );
}
