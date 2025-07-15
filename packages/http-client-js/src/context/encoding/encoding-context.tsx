import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { NoTarget } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { reportDiagnostic } from "../../lib.js";
import { EncodingDefaults } from "./types.js";

export const EncodingContext: ComponentContext<EncodingDefaults> =
  createNamedContext<EncodingDefaults>("Encoding");

export function useEncoding() {
  const context = useContext(EncodingContext);
  const { $ } = useTsp();

  if (!context) {
    reportDiagnostic($.program, {
      code: "use-encoding-context-without-provider",
      target: NoTarget,
    });
  }

  return context!;
}

export function useDefaultEncoding(scalarType: keyof EncodingDefaults): string | undefined {
  const defaults = useEncoding();
  return defaults[scalarType];
}
