// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  DecoratorContext,
  EmitContext,
  EmitOptionsFor,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Program,
  resolvePath,
  StringLiteral,
  Tuple,
  Type,
} from "@typespec/compiler";

import { StreamingMode } from "./ast.js";
import { ProtobufEmitterOptions, reportDiagnostic, state, TypeSpecProtobufLibrary } from "./lib.js";
import { createProtobufEmitter } from "./transform/index.js";

/**
 * # @typespec/protobuf : Protobuf/gRPC Emitter and Decorators for TypeSpec
 *
 * This module defines an emitter and decorator library for TypeSpec that enables specifying Protobuf services and models.
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
 * ident = letter \{ letter | decimalDigit | "_" \}
 * fullIdent = ident \{ "." ident \}
 */
export const PROTO_FULL_IDENT = /([a-zA-Z][a-zA-Z0-9_]*)+/;

/**
 * Decorate an interface as a service, indicating that it represents a Protobuf `service` declaration.
 *
 * @param ctx - decorator context
 * @param target - the decorated interface
 */
export function $service(ctx: DecoratorContext, target: Interface) {
  ctx.program.stateSet(state.service).add(target);
}

export interface PackageDetails {
  name?: string;
}

/**
 * Declare a Protobuf package.
 *
 * @param ctx - decorator context
 * @param target - target decorator namespace
 */
export function $package(ctx: DecoratorContext, target: Namespace, details?: Model) {
  ctx.program.stateMap(state.package).set(target, details);
}

/**
 * Determines whether a type represents a Protobuf map.
 *
 * @param program - the program context
 * @param m - the type to test
 * @returns true if the internal representation of a Protobuf map is bound to this type.
 */
export function isMap(program: Program, m: Type): boolean {
  return program.stateSet(state._map).has(m);
}

/**
 * Binds the internal representation of a Protobuf map.
 * @internal
 * @param ctx
 * @param target
 */
export function $_map(ctx: DecoratorContext, target: Model) {
  ctx.program.stateSet(state._map).add(target);
}

export function $externRef(
  ctx: DecoratorContext,
  target: Model,
  path: StringLiteral,
  name: StringLiteral
) {
  ctx.program.stateMap(state.externRef).set(target, [path.value, name.value]);
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

  return Object.assign(
    (t as Tuple).values.map((v) => (v as NumericLiteral).value) as [number, number],
    { type: t }
  );
}

export type Reservation = string | number | ([number, number] & { type: Type });

export function $reserve(
  ctx: DecoratorContext,
  target: Model,
  ...reservations: readonly (Type | number | string)[]
) {
  const finalReservations = reservations
    .map((reservation) =>
      typeof reservation === "object" ? getTuple(ctx.program, reservation) : reservation
    )
    .filter((v) => v != null);

  ctx.program.stateMap(state.reserve).set(target, finalReservations);
}

export function $message(ctx: DecoratorContext, target: Model) {
  ctx.program.stateSet(state.message).add(target);
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
export async function $onEmit(ctx: EmitContext<EmitOptionsFor<TypeSpecProtobufLibrary>>) {
  const emitter = createProtobufEmitter(ctx.program);

  await emitter(resolvePath(ctx.emitterOutputDir), ctx.options);
}

/**
 * Validation function
 */
export async function $onValidate(program: Program) {
  // Is this correct? See https://github.com/microsoft/typespec/issues/1859
  /* c8 ignore next 6 */
  if (program.compilerOptions.noEmit) {
    const options = program.emitters.find((e) => e.emitFunction === $onEmit)
      ?.options as ProtobufEmitterOptions;
    const emitter = createProtobufEmitter(program);
    await emitter("", options);
  }
}

export const namespace = "TypeSpec.Protobuf";
