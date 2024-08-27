import { Binder, OutputScope } from "@alloy-js/core";
import { PythonOutputSymbol } from "./index.js";

export interface PythonMemberScope extends OutputScope {
  kind: "member";
  owner: PythonOutputSymbol;
}

export function createPythonMemberScope(
  binder: Binder,
  parent: OutputScope,
  owner: PythonOutputSymbol
): PythonMemberScope {
  return binder.createScope<PythonMemberScope>({
    kind: "member",
    name: "members",
    owner,
    parent,
  });
}
