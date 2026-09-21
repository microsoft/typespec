// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

const rawJsonProperties = new WeakMap<object, Set<PropertyKey>>();

/** Marks a field as user JSON without changing the in-memory code-model shape. */
export function withRawJson<T extends object>(owner: T, property: keyof T): T {
  let properties = rawJsonProperties.get(owner);
  if (!properties) {
    properties = new Set();
    rawJsonProperties.set(owner, properties);
  }
  properties.add(property);
  return owner;
}

export function isRawJsonProperty(owner: object, property: string): boolean {
  return rawJsonProperties.get(owner)?.has(property) ?? false;
}
