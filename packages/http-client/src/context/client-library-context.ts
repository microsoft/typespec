import type { ComponentContext } from "@alloy-js/core";
import { createNamedContext, useContext } from "@alloy-js/core";
import { NoTarget } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import type { ClientLibrary } from "../client-library.js";
import { reportDiagnostic } from "../lib.js";

/**
 * Alloy context for a collected client library, normally provided by the `ClientLibrary` component.
 * A custom provider can supply an already-collected library to its descendants.
 */
export const ClientLibraryContext: ComponentContext<ClientLibrary> =
  createNamedContext<ClientLibrary>("ClientLibrary");

/**
 * Reads the nearest client-library provider in the Alloy owner chain.
 * Requires emitter-framework TypeSpec context and a client-library provider. If the latter is
 * missing, reports a diagnostic and returns undefined at runtime despite the non-null return type.
 */
export function useClientLibrary() {
  const { program } = useTsp();
  const context = useContext(ClientLibraryContext);

  if (!context) {
    reportDiagnostic(program, { code: "use-client-context-without-provider", target: NoTarget });
  }

  return context!;
}
