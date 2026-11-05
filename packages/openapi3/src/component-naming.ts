import type { Program, Type, TypeNameOptions } from "@typespec/compiler";
import { getOpenAPITypeName } from "@typespec/openapi";
import type { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";

export function hasCustomComponentNames(options: ResolvedOpenAPI3EmitterOptions): boolean {
  return (
    options.componentNameStrategy?.kind === "name-only" ||
    (options.componentNameStrategy?.separator ?? ".") !== "."
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
