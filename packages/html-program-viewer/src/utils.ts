import { getNamespaceFullName, Type, Union } from "@cadl-lang/compiler";

export function getIdForType(type: Type): string | undefined {
  if (type.kind === "Namespace") {
    return getNamespaceFullName(type);
  } else if ("interface" in type && type.interface) {
    return `${getIdForType(type.interface)}.${type.name}`;
  } else if ("model" in type && type.model) {
    return `${getIdForType(type.model)}.${type.name}`;
  } else if ("namespace" in type && type.namespace) {
    return type.namespace.name === ""
      ? type.name
      : `${getNamespaceFullName(type.namespace)}.${type.name}`;
  } else if ("name" in type) {
    return type.name?.toString();
  } else {
    return undefined;
  }
}

export function isNamedUnion(union: Union): union is Union & { name: string } {
  return union.name !== undefined;
}
