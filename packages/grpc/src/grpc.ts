// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  createDecoratorDefinition,
  DecoratorContext,
  EmitOptionsFor,
  Interface,
  ModelProperty,
  Namespace,
  Program,
} from "@cadl-lang/compiler";

import { CadlGrpcLibrary, reportDiagnostic, state } from "./lib.js";
import { createGrpcEmitter } from "./transform.js";

/**
 * # cadl-grpc : gRPC/Protobuf Emitter and Decorators for CADL
 *
 * This module defines an emitter and decorator library for CADL that enables specifying gRPC services and Protobuf
 * models.
 */

/**
 * The maximum field index allowed by Protocol Buffers.
 */
const MAX_FIELD_INDEX = 2 ** 29 - 1;

/**
 * The field range between 19000 and 19999 is reserved for Protobuf client implementations.
 */
const IMPLEMENTATION_RESERVED_RANGE = [19000, 19999] as const;

const packageDecorator = createDecoratorDefinition({
  name: "@package",
  args: [{ kind: "String", optional: true }],
  target: "Namespace",
} as const);

/**
 * Defined in the [ProtoBuf Language Spec](https://developers.google.com/protocol-buffers/docs/reference/proto3-spec#identifiers).
 *
 * ident = letter { letter | decimalDigit | "_" }
 * fullIdent = ident { "." ident }
 */
export const PROTO_FULL_IDENT = /([a-zA-Z][a-zA-Z0-9_]*)+/;

/**
 * Decorate a namespace as a package, indicating that it represents a single Protobuf unit (a single file with a
 * `package` declaration).
 *
 * @param ctx - decorator context
 * @param target - the decorated namespace
 * @param name - the package's name (not optional)
 */
export function $package(ctx: DecoratorContext, target: Namespace, name?: string) {
  if (!packageDecorator.validate(ctx, target, [name])) {
    return;
  }

  if (name && !PROTO_FULL_IDENT.test(name)) {
    reportDiagnostic(ctx.program, {
      code: "invalid-package-name",
      target: ctx.getArgumentTarget(0)!,
      format: {
        name,
      },
    });
  }

  ctx.program.stateMap(state.package).set(target, name);
}

const serviceDecorator = createDecoratorDefinition({
  name: "@service",
  args: [],
  target: "Interface",
} as const);

/**
 * Decorate an interface as a service, indicating that it represents a gRPC `service` declaration.
 *
 * @param ctx - decorator context
 * @param target - the decorated interface
 */
export function $service(ctx: DecoratorContext, target: Interface) {
  if (!serviceDecorator.validate(ctx, target, [])) {
    return;
  }

  // TODO/DESIGN: do we allow service interfaces to extend/compose other interfaces?

  ctx.program.stateSet(state.service).add(target);
}

const fieldDecorator = createDecoratorDefinition({
  name: "@field",
  args: [{ kind: "Number", optional: false }],
  target: "ModelProperty",
} as const);

/**
 * Decorate a model property with a field index. Field indices are required for all fields of emitted messages.
 *
 * @param param0
 * @param target
 * @param fieldIndex
 * @returns
 */
export function $field(ctx: DecoratorContext, target: ModelProperty, fieldIndex: number) {
  if (!fieldDecorator.validate(ctx, target, [fieldIndex])) {
    return;
  }

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
        max: String(MAX_FIELD_INDEX),
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
export async function $onEmit(program: Program, options?: EmitOptionsFor<CadlGrpcLibrary>) {
  const emitter = createGrpcEmitter(program);

  await emitter({
    outputDirectory: options?.outputDirectory,
  });
}

export const namespace = "Cadl.Grpc";

export { CadlGrpcLibrary as $lib };
