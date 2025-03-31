import { Children } from "@alloy-js/core";
import { Program } from "@typespec/compiler";
import { unsafe_Mutator } from "@typespec/compiler/experimental";
import { createClientLibrary } from "../client-library.js";
import { ClientLibraryContext } from "../context/client-library-context.js";

export interface ClientLibraryProps {
  operationMutators?: unsafe_Mutator[];
  program: Program;
  children?: Children;
}

export function ClientLibrary(props: ClientLibraryProps) {
  const clientLibrary = createClientLibrary(props.program, {
    operationMutators: props.operationMutators,
  });
  return (
    <ClientLibraryContext.Provider value={clientLibrary}>
      {props.children}
    </ClientLibraryContext.Provider>
  );
}
