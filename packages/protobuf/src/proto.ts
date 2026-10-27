// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type {
  DecoratorContext,
  EmitContext,
  EmitOptionsFor,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  StringLiteral,
  Type,
  UnionVariant,
} from "@typespec/compiler";
import { resolvePath } from "@typespec/compiler";

import type {
  FieldDecorator,
  MessageDecorator,
  PackageDecorator,
  ReserveDecorator,
  StreamDecorator,
} from "../generated-defs/TypeSpec.Protobuf.js";
import type {
  ExternRefDecorator,
  LongRunningDecorator,
} from "../generated-defs/TypeSpec.Protobuf.Private.js";
import { StreamingMode } from "./ast.js";
import type { ProtobufEmitterOptions, TypeSpecProtobufLibrary } from "./lib.js";
import { reportDiagnostic, state } from "./lib.js";
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
 * letter = "A" ... "Z" | "a" ... "z" | "_"
 * ident = letter \{ letter | decimalDigit \}
 * fullIdent = ident \{ "." ident \}
 */
export const PROTO_FULL_IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

/**
 * A single Protobuf `ident`, such as a field or `oneof` name. See {@link PROTO_FULL_IDENT}.
 */
export const PROTO_IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Decorate an interface as a service, indicating that it represents a Protobuf `service` declaration.
 *
 * @param ctx - decorator context
 * @param target - the decorated interface
 */
export function $service(ctx: DecoratorContext, target: Interface) {
  ctx.program.stateSet(state.service).add(target);
}

/** Package-name metadata for a namespace annotated with `@package`. */
export interface PackageDetails {
  /**
   * Fully qualified Protobuf package name, also used to determine the emitted file path.
   * When absent, the file is named `main.proto` and has no `package` declaration.
   */
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
  details?: Type,
) => {
  if (details?.kind === "Model") {
    const nameProperty = details.properties.get("name");
    const name = nameProperty?.type;
    if (nameProperty && name?.kind === "String" && !PROTO_FULL_IDENT.test(name.value)) {
      reportDiagnostic(ctx.program, {
        code: "invalid-package-name",
        format: { name: name.value },
        target: nameProperty,
      });
      return;
    }
  }
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
  name: Type,
) => {
  ctx.program
    .stateMap(state.externRef)
    .set(target, [(path as StringLiteral).value, (name as StringLiteral).value]);
};

/**
 * Records whether a service operation streams its input, output, both, or neither.
 * Operations without this decorator use the non-streaming `None` mode.
 */
export const $stream: StreamDecorator = (ctx: DecoratorContext, target: Operation, mode: Type) => {
  const emitStreamingMode = {
    Duplex: StreamingMode.Duplex,
    In: StreamingMode.In,
    Out: StreamingMode.Out,
    None: StreamingMode.None,
  }[(mode as any).name as string];

  ctx.program.stateMap(state.stream).set(target, emitStreamingMode);
};

/**
 * The response and metadata types of a long-running operation, the arguments of a `LongRunningOperation` instance.
 */
export interface LongRunningInfo {
  responseType: Model;
  metadataType: Model;
}

/**
 * Binds the response and metadata types of a `LongRunningOperation` instance.
 * @internal
 */
export const $longRunning: LongRunningDecorator = (
  ctx: DecoratorContext,
  target: Model,
  responseType: Model,
  metadataType: Model,
) => {
  const info: LongRunningInfo = { responseType, metadataType };
  ctx.program.stateMap(state.longRunning).set(target, info);
};

/**
 * A field name, field index, or inclusive range of field indices reserved against reuse in a message.
 * A range's `type` property carries TypeSpec type metadata; collision checks use only the numeric bounds.
 */
export type Reservation = string | number | ([number, number] & { type: Type });

/**
 * Records field names, indices, and inclusive index ranges reserved on a model or union wrapper message.
 * Emission reports a diagnostic if a field uses a reserved name or index.
 */
export const $reserve: ReserveDecorator = (
  ctx: DecoratorContext,
  target: Type,
  ...reservations: readonly (unknown | number | string)[]
) => {
  const finalReservations = reservations.filter((v) => v != null);
  ctx.program.stateMap(state.reserve).set(target, finalReservations);
};

/**
 * Marks a model or named union for emission even when it is not reachable from a service operation.
 * A named union is emitted as a wrapper message containing a `oneof value`.
 */
export const $message: MessageDecorator = (ctx: DecoratorContext, target: Type) => {
  ctx.program.stateSet(state.message).add(target);
};

/**
 * Decorate a model property or union variant with a field index. Field indices are required for all fields of emitted
 * messages and all variants of unions that are emitted as a `oneof`.
 *
 * @param ctx - Decorator context whose program stores the field index.
 * @param target - Model property or union variant to number.
 * @param fieldIndex - Positive integer no greater than 2^29 - 1, excluding 19000 through 19999.
 */
export const $field: FieldDecorator = (
  ctx: DecoratorContext,
  target: ModelProperty | UnionVariant,
  fieldIndex: number,
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
 * Compiler emitter hook that converts annotated packages to Protobuf files in the emitter output directory.
 * Conversion still validates the program when `noEmit` or the compiler's dry-run mode suppresses file writes.
 *
 * @param ctx - Program, output directory, and options supplied by the compiler.
 */
export async function $onEmit(ctx: EmitContext<EmitOptionsFor<TypeSpecProtobufLibrary>>) {
  const emitter = createProtobufEmitter(ctx.program);

  await emitter(resolvePath(ctx.emitterOutputDir), ctx.options);
}

/**
 * Compiler validation hook that runs Protobuf conversion during a dry run, without writing files.
 * Outside dry-run mode, conversion and its diagnostics are handled by {@link $onEmit}.
 */
export async function $onValidate(program: Program) {
  // Is this correct? See https://github.com/microsoft/typespec/issues/1859
  /* c8 ignore next 6 */
  if (program.compilerOptions.dryRun) {
    const options = program.emitters.find((e) => e.emitFunction === $onEmit)
      ?.options as ProtobufEmitterOptions;
    const emitter = createProtobufEmitter(program);
    await emitter("", options);
  }
}

export const namespace = "TypeSpec.Protobuf";
