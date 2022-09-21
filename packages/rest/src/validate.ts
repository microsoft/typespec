import { Program } from "@cadl-lang/compiler";
import { getAllHttpServices } from "./http/operations.js";

export function $onValidate(program: Program) {
  const [, diagnostics] = getAllHttpServices(program);

  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
}
