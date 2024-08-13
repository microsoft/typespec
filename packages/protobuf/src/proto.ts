// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  DecoratorContext,
  EmitContext,
  EmitOptionsFor,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  resolvePath,
  StringLiteral,
  Type,
} from "@typespec/compiler";

import {
  FieldDecorator,
  MessageDecorator,
  PackageDecorator,
  ReserveDecorator,
  StreamDecorator,
} from "../generated-defs/TypeSpec.Protobuf.js";
import { ExternRefDecorator } from "../generated-defs/TypeSpec.Protobuf.Private.js";
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
export const $package: PackageDecorator = (
  ctx: DecoratorContext,
  target: Namespace,
  details?: Type
) => {
  ctx.program.stateMap(state.package).set(target, details);
};

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

export const $externRef: ExternRefDecorator = (
  ctx: DecoratorContext,
  target: Model,
  path: Type,
  name: Type
) => {
  ctx.program
    .stateMap(state.externRef)
    .set(target, [(path as StringLiteral).value, (name as StringLiteral).value]);
};

export const $stream: StreamDecorator = (ctx: DecoratorContext, target: Operation, mode: Type) => {
  const emitStreamingMode = {
    Duplex: StreamingMode.Duplex,
    In: StreamingMode.In,
    Out: StreamingMode.Out,
    None: StreamingMode.None,
  }[(mode as any).name as string];

  ctx.program.stateMap(state.stream).set(target, emitStreamingMode);
};

export type Reservation = string | number | ([number, number] & { type: Type });

export const $reserve: ReserveDecorator = (
  ctx: DecoratorContext,
  target: Type,
  ...reservations: readonly (unknown | number | string)[]
) => {
  const finalReservations = reservations.filter((v) => v != null);
  ctx.program.stateMap(state.reserve).set(target, finalReservations);
};

export const $message: MessageDecorator = (ctx: DecoratorContext, target: Type) => {
  ctx.program.stateSet(state.message).add(target);
};

/**
 * Decorate a model property with a field index. Field indices are required for all fields of emitted messages.
 *
 * @param param0
 * @param target
 * @param fieldIndex
 * @returns
 */
export const $field: FieldDecorator = (
  ctx: DecoratorContext,
  target: ModelProperty,
  fieldIndex: number
) => {
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
};

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
