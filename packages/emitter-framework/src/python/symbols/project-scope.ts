import { Binder, OutputScope } from "@alloy-js/core";

export interface PythonProjectScope extends OutputScope {
  kind: "project";
}

export function createPythonProjectScope(binder: Binder, name: string): PythonProjectScope {
  return binder.createScope<PythonProjectScope>({
    kind: "project",
    name,
  });
}
