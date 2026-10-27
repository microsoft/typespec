import { type Children } from "@alloy-js/core";
import type { Program } from "@typespec/compiler";
import type { unsafe_Mutator } from "@typespec/compiler/experimental";
import { createClientLibrary } from "../client-library.js";
import { ClientLibraryContext } from "../context/client-library-context.js";

/** Inputs for collecting a program's clients and providing them to descendant Alloy components. */
export interface ClientLibraryProps {
  /** Reserved operation-mutator input; library collection does not currently apply these mutators. */
  operationMutators?: unsafe_Mutator[];
  /** Compiled program whose namespaces, interfaces, and HTTP operations form the client library. */
  program: Program;
  /** Components to render with access to the collected library through `useClientLibrary`. */
  children?: Children;
}

/**
 * Collects the program's client hierarchy and provides it to descendant Alloy components.
 * This establishes client-library context only; consumers of `useClientLibrary` also need the
 * emitter-framework TypeSpec context used by `useTsp`.
 */
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
