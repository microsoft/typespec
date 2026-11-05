import type { Program, Type, TypeNameOptions } from "@typespec/compiler";
import { getOpenAPITypeName } from "@typespec/openapi";
import { reportDiagnostic } from "./lib.js";
import type { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { ensureValidComponentFixedFieldKey } from "./util.js";

export function hasCustomComponentNames(options: ResolvedOpenAPI3EmitterOptions): boolean {
  return (
    options.componentNameStrategy?.kind === "name-only" ||
    (options.componentNameStrategy?.separator ?? ".") !== "." ||
    options.componentNameCharacterSet === "alphanumeric"
  );
}

export function getComponentTypeName(
  program: Program,
  type: Type,
  typeNameOptions: TypeNameOptions,
  options: ResolvedOpenAPI3EmitterOptions,
): string {
  const strategy = options.componentNameStrategy;
  const name = getOpenAPITypeName(program, type, {
    ...typeNameOptions,
    nameOnly: strategy?.kind === "name-only",
  });
  const separator = strategy?.separator ?? ".";
  if (strategy?.kind === "name-only" || separator === ".") {
    return name;
  }

  const localName = getOpenAPITypeName(program, type, { ...typeNameOptions, nameOnly: true });
  // Friendly names, declaration expressions, and standard types are already unqualified.
  if (name === localName) return name;

  const segments = [localName];
  let namespace = "namespace" in type ? type.namespace : undefined;
  while (namespace && namespace.name !== "") {
    if (typeNameOptions.namespaceFilter && !typeNameOptions.namespaceFilter(namespace)) break;
    segments.unshift(namespace.name);
    namespace = namespace.namespace;
  }
  return segments.join(separator);
}

export function normalizeComponentName(
  program: Program,
  type: Type,
  name: string,
  options: ResolvedOpenAPI3EmitterOptions,
): string | undefined {
  if (options.componentNameCharacterSet !== "alphanumeric") {
    return ensureValidComponentFixedFieldKey(program, type, name);
  }
  const result = name.replace(/[^A-Za-z0-9]/g, "");
  if (result === "") {
    reportDiagnostic(program, { code: "empty-component-name", format: { name }, target: type });
    return undefined;
  }
  return result;
}
