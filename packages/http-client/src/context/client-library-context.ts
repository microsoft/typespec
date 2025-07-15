import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { NoTarget } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { ClientLibrary } from "../client-library.js";
import { reportDiagnostic } from "../lib.js";

export const ClientLibraryContext: ComponentContext<ClientLibrary> =
  createNamedContext<ClientLibrary>("ClientLibrary");

export function useClientLibrary() {
  const { program } = useTsp();
  const context = useContext(ClientLibraryContext);

  if (!context) {
    reportDiagnostic(program, { code: "use-client-context-without-provider", target: NoTarget });
  }

  return context!;
}
