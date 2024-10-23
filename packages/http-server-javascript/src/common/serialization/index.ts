// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { Model, NoTarget, Scalar, Type, Union } from "@typespec/compiler";
import { JsContext, Module, completePendingDeclarations } from "../../ctx.js";
import { UnimplementedError } from "../../util/error.js";
import { indent } from "../../util/iter.js";
import { createOrGetModuleForNamespace } from "../namespace.js";
import { emitTypeReference } from "../reference.js";
import { emitJsonSerialization, requiresJsonSerialization } from "./json.js";

export type SerializableType = Model | Scalar | Union;

export function isSerializableType(t: Type): t is SerializableType {
  return t.kind === "Model" || t.kind === "Scalar" || t.kind === "Union";
}

export type SerializationContentType = "application/json";

const _SERIALIZATIONS_MAP = new WeakMap<SerializableType, Set<SerializationContentType>>();

export function requireSerialization(
  ctx: JsContext,
  type: Type,
  contentType: SerializationContentType,
): void {
  if (!isSerializableType(type)) {
    throw new UnimplementedError(`no implementation of JSON serialization for type '${type.kind}'`);
  }

  let serializationsForType = _SERIALIZATIONS_MAP.get(type);

  if (!serializationsForType) {
    serializationsForType = new Set();
    _SERIALIZATIONS_MAP.set(type, serializationsForType);
  }

  serializationsForType.add(contentType);

  ctx.serializations.add(type);
}

export interface SerializationContext extends JsContext {}

export function emitSerialization(ctx: JsContext): void {
  completePendingDeclarations(ctx);

  const serializationContext: SerializationContext = {
    ...ctx,
  };

  while (!ctx.serializations.isEmpty()) {
    const type = ctx.serializations.take()!;

    const serializations = _SERIALIZATIONS_MAP.get(type)!;

    const requiredSerializations = new Set<SerializationContentType>(
      [...serializations].filter((serialization) =>
        isSerializationRequired(ctx, type, serialization),
      ),
    );

    if (requiredSerializations.size > 0) {
      emitSerializationsForType(serializationContext, type, serializations);
    }
  }
}

export function isSerializationRequired(
  ctx: JsContext,
  type: Type,
  serialization: SerializationContentType,
): boolean {
  switch (serialization) {
    case "application/json": {
      return requiresJsonSerialization(ctx, type);
    }
    default:
      throw new Error(`Unreachable: serialization content type ${serialization satisfies never}`);
  }
}

function emitSerializationsForType(
  ctx: SerializationContext,
  type: SerializableType,
  serializations: Set<SerializationContentType>,
): void {
  const isSynthetic = ctx.syntheticNames.has(type) || !type.namespace;

  const module = isSynthetic
    ? ctx.syntheticModule
    : createOrGetModuleForNamespace(ctx, type.namespace!);

  const typeName = emitTypeReference(ctx, type, NoTarget, module);

  const serializationCode = [`export const ${typeName} = {`];

  for (const serialization of serializations) {
    serializationCode.push(
      ...indent(emitSerializationForType(ctx, type, serialization, module, typeName)),
    );
  }

  serializationCode.push("} as const;");

  module.declarations.push(serializationCode);
}

function* emitSerializationForType(
  ctx: SerializationContext,
  type: SerializableType,
  contentType: SerializationContentType,
  module: Module,
  typeName: string,
): Iterable<string> {
  switch (contentType) {
    case "application/json": {
      yield* emitJsonSerialization(ctx, type, module, typeName);
      break;
    }
    default:
      throw new Error(`Unreachable: serialization content type ${contentType satisfies never}`);
  }
}
