// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  DecoratorContext,
  EmitOptionsFor,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Program,
  Tuple,
  Type,
} from "@cadl-lang/compiler";

import { StreamingMode } from "./ast.js";
import { CadlProtobufLibrary, reportDiagnostic, state } from "./lib.js";
import { createProtobufEmitter } from "./transform.js";

/**
 * # cadl-protobuf : Protobuf/gRPC Emitter and Decorators for CADL
 *
 * This module defines an emitter and decorator library for CADL that enables specifying Protobuf services and models.
 */

/**
 * The maximum field index allowed by Protocol Buffers.
 */
const MAX_FIELD_INDEX = 2 ** 29 - 1;

/**
 * The field range between 19000 and 19999 is reserved for Protobuf client implementations.
 */
const IMPLEMENTATION_RESERVED_RANGE = [19000, 19999] as const;

/**
 * Defined in the [ProtoBuf Language Spec](https://developers.google.com/protocol-buffers/docs/reference/proto3-spec#identifiers).
 *
 * ident = letter { letter | decimalDigit | "_" }
 * fullIdent = ident { "." ident }
 */
export const PROTO_FULL_IDENT = /([a-zA-Z][a-zA-Z0-9_]*)+/;

/**
 * Decorate an interface as a service, indicating that it represents a Protobuf `service` declaration.
 *
 * @param ctx - decorator context
 * @param target - the decorated interface
 */
export function $serviceInterface(ctx: DecoratorContext, target: Interface) {
  ctx.program.stateSet(state.serviceInterface).add(target);
}

/**
 * Rename a package instead of using the implied name of the service namespace.
 *
 * @param ctx - decorator context
 * @param target - target decorator namespace
 */
export function $packageName(ctx: DecoratorContext, target: Namespace, name: string) {
  ctx.program.stateMap(state.packageName).set(target, name);
}

const mapState = Symbol("cadl-protobuf::_map");

export function isMap(program: Program, m: Type): boolean {
  return program.stateSet(mapState).has(m);
}

export function $_map(ctx: DecoratorContext, target: Model) {
  ctx.program.stateSet(mapState).add(target);
}

export function $externRef(ctx: DecoratorContext, target: Model, path: string, name: string) {
  ctx.program.stateMap(state.externRef).set(target, [path, name]);
}

export function $stream(ctx: DecoratorContext, target: Operation, mode: EnumMember) {
  const emitStreamingMode = {
    Duplex: StreamingMode.Duplex,
    In: StreamingMode.In,
    Out: StreamingMode.Out,
    None: StreamingMode.None,
  }[mode.name as string];

  ctx.program.stateMap(state.stream).set(target, emitStreamingMode);
}

function getTuple(program: Program, t: Type): [number, number] | null {
  if (t.kind !== "Tuple" || t.values.some((v) => v.kind !== "Number") || t.values.length !== 2) {
    reportDiagnostic(program, {
      code: "illegal-reservation",
      target: t,
    });

    return null;
  }

  return (t as Tuple).values.map((v) => (v as NumericLiteral).value) as [number, number];
}

export function $reserve(
  ctx: DecoratorContext,
  target: Model,
  ...reservations: readonly (Type | number | string)[]
) {
  const finalReservations = reservations.map((reservation) =>
    typeof reservation === "object" ? getTuple(ctx.program, reservation) : reservation
  );

  ctx.program.stateMap(state.reserve).set(target, finalReservations);
}

/**
 * Decorate a model property with a field index. Field indices are required for all fields of emitted messages.
 *
 * @param param0
 * @param target
 * @param fieldIndex
 * @returns
 */
export function $field(ctx: DecoratorContext, target: ModelProperty, fieldIndex: number) {
  if (!Number.isInteger(fieldIndex) || fieldIndex <= 0) {
    reportDiagnostic(ctx.program, {
      code: "field-index",
      messageId: "invalid",
      format: {
        index: String(fieldIndex),
      },
      target,
    });
    return;
  } else if (fieldIndex > MAX_FIELD_INDEX) {
    reportDiagnostic(ctx.program, {
      code: "field-index",
      messageId: "out-of-bounds",
      format: {
        index: String(fieldIndex),
        max: String(MAX_FIELD_INDEX + 1),
      },
      target,
    });
    return;
  } else if (
    fieldIndex >= IMPLEMENTATION_RESERVED_RANGE[0] &&
    fieldIndex <= IMPLEMENTATION_RESERVED_RANGE[1]
  ) {
    reportDiagnostic(ctx.program, {
      code: "field-index",
      messageId: "reserved",
      format: {
        index: String(fieldIndex),
      },
      target,
    });
  }

  ctx.program.stateMap(state.fieldIndex).set(target, fieldIndex);
}

/**
 * Emitter main function.
 *
 * @param program - the program to emit
 */
export async function $onEmit(program: Program, options?: EmitOptionsFor<CadlProtobufLibrary>) {
  const emitter = createProtobufEmitter(program);

  await emitter({
    outputDirectory: options?.outputDirectory,
  });
}

/*export async function $onValidate(program: Program) {
  const emitter = createGrpcEmitter(program);

  await emitter({
    noEmit: true,
  });
}*/

export const namespace = "Cadl.Protobuf";

export { CadlProtobufLibrary as $lib };
