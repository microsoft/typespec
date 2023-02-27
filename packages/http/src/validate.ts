import { Program } from "@typespec/compiler";
import { getAllHttpServices } from "./operations.js";

export function $onValidate(program: Program) {
  // Pass along any diagnostics that might be returned from the HTTP library
  const [, diagnostics] = getAllHttpServices(program);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
}
