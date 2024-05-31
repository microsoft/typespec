// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Namespace, Type } from "@typespec/compiler";

/**
 * A TypeSpec type that may be attached to a namespace.
 */
export type NamespacedType = Extract<Type, { namespace?: Namespace | undefined }>;

/**
 * Computes the fully-qualified name of a TypeSpec type, i.e. `TypeSpec.boolean` for the built-in `boolean` scalar.
 */
export function getFullyQualifiedTypeName(type: NamespacedType): string {
  const name = type.name ?? "<unknown>";
  if (type.namespace) {
    return getFullyQualifiedNamespacePath(type.namespace).join(".") + "." + name;
  } else {
    return name;
  }
}

function getFullyQualifiedNamespacePath(ns: Namespace): string[] {
  if (ns.namespace) {
    const innerPath = getFullyQualifiedNamespacePath(ns.namespace);
    innerPath.push(ns.name);
    return innerPath;
  } else {
    return [ns.name];
  }
}
