import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { NoTarget } from "@typespec/compiler";
import { useTypekit } from "@typespec/emitter-framework";
import { ClientLibrary } from "../client-library.js";
import { reportDiagnostic } from "../lib.js";

export const ClientLibraryContext: ComponentContext<ClientLibrary> =
  createNamedContext<ClientLibrary>("ClientLibrary");

export function useClientLibrary() {
  const context = useContext(ClientLibraryContext);

  const { $ } = useTypekit();

  if (!context) {
    reportDiagnostic($.program, { code: "use-client-context-without-provider", target: NoTarget });
  }

  return context!;
}
