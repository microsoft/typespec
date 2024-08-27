import { Binder, OutputScope } from "@alloy-js/core";

export interface PythonPackageScope extends OutputScope {
  kind: "package";
}

export function createPythonPackageScope(binder: Binder, name: string): PythonPackageScope {
  return binder.createScope<PythonPackageScope>({
    kind: "package",
    name,
  });
}
