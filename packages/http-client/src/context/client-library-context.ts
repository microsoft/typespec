import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { NoTarget } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { ClientLibrary } from "../client-library.js";
import { reportDiagnostic } from "../lib.js";

export const ClientLibraryContext: ComponentContext<ClientLibrary> =
  createNamedContext<ClientLibrary>("ClientLibrary");

export function useClientLibrary() {
  const context = useContext(ClientLibraryContext);

  if (!context) {
    reportDiagnostic($.program, { code: "use-client-context-without-provider", target: NoTarget });
  }

  return context!;
}
