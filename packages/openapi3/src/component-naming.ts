import type { Program, Type, TypeNameOptions } from "@typespec/compiler";
import { getFriendlyName, getTypeName, isStdNamespace } from "@typespec/compiler";
import type { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";

export function getComponentTypeName(
  program: Program,
  type: Type,
  typeNameOptions: TypeNameOptions,
  options: ResolvedOpenAPI3EmitterOptions,
): string {
  const strategy = options.componentNameStrategy;
  const friendlyName = getFriendlyName(program, type);
  const name = friendlyName ?? getTypeName(type, { ...typeNameOptions, nameOnly: true });
  let namespace = "namespace" in type ? type.namespace : undefined;
  if (
    friendlyName !== undefined ||
    strategy?.kind === "name-only" ||
    ("expression" in type && type.expression) ||
    (namespace && isStdNamespace(namespace))
  ) {
    return name;
  }

  const segments = [name];
  while (namespace && namespace.name !== "") {
    if (typeNameOptions.namespaceFilter && !typeNameOptions.namespaceFilter(namespace)) break;
    segments.unshift(namespace.name);
    namespace = namespace.namespace;
  }
  return segments.join(strategy?.separator ?? ".");
}
