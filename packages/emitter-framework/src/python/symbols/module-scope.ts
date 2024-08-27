import { Binder, OutputScope } from "@alloy-js/core";

export interface PythonModuleScope extends OutputScope {
  kind: "module";
}

export function createPythonModuleScope(binder: Binder, name: string): PythonModuleScope {
  return binder.createScope<PythonModuleScope>({
    kind: "module",
    name,
  });
}
