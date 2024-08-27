import { createNamePolicy, NamePolicy } from "@alloy-js/core";
import { constantCase, pascalCase, snakeCase } from "change-case";

export type PythonElements =
  | "class"
  | "classMember"
  | "enum"
  | "enumMember"
  | "function"
  | "parameter"
  | "constant"
  | "variable";

export function createPythonNamePolicy(): NamePolicy<PythonElements> {
  return createNamePolicy((name, element) => {
    switch (element) {
      case "class":
      case "enum":
        return pascalCase(name);
      case "enumMember":
      case "constant":
        return constantCase(name);
      default:
        return snakeCase(name);
    }
  });
}

export function usePythonNamePolicy(): NamePolicy<PythonElements> {
  return createPythonNamePolicy();
}
