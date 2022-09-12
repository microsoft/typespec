import { getServiceNamespace, Program } from "@cadl-lang/compiler";
import { resolveHttpOperations } from "./http/operations.js";

export function $onValidate(program: Program) {
  const serviceNamespace = getServiceNamespace(program);
  const [, diagnostics] = resolveHttpOperations(program, serviceNamespace);

  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
}
