// Copyright (c) Microsoft Corporation.

import type { Namespace } from "@typespec/compiler";

/**
 * This module describes an AST for Protobuf.
 */

/**
 * A single .proto file.
 */
export interface ProtoFile {
  /**
   * The package name, if one is known.
   */
  package?: string;
  /**
   * The `option` specifiers to include in the file.
   */
  options: Partial<WellKnownFileOptions>;

  /**
   * Paths imported by this file.
   */
  imports: string[];

  /**
   * The declarations in the file.
   *
   * Only `service` and `message` declarations may exist at the root of the file.
   */
  declarations: Iterable<ProtoTopLevelDeclaration>;

  /**
   * The original namespace node from which this ProtoFile originated.
   */
  source: Namespace;

  /**
   * The package-level documentation comment, if any.
   */
  doc?: string | undefined;
}

/**
 * The built-in options that are defined by Protobuf.
 */
export interface WellKnownFileOptions {
  java_package: string;
  java_outer_classname: string;

  optimize_for: "SPEED" | "CODE_SIZE" | "LITE_RUNTIME";

  cc_enable_arenas: boolean;
}

/**
 * A top-level declaration.
 */
export type ProtoTopLevelDeclaration =
  | ProtoServiceDeclaration
  | ProtoMessageDeclaration
  | ProtoEnumDeclaration;

/**
 * A declaration. One of `service`, `message`, a field within a message, `one_of`, `enum`, or an `rpc` method.
 */
export type ProtoDeclaration =
  | ProtoServiceDeclaration
  | ProtoMessageDeclaration
  | ProtoFieldDeclaration
  | ProtoOneOfDeclaration
  | ProtoEnumDeclaration
  | ProtoMethodDeclaration
  | ProtoEnumVariantDeclaration;

/**
 * A Protobuf scalar type.
 */
export type ScalarName = ScalarIntegralName | "double" | "float" | "bytes" | "string";

/**
 * A Protobuf integral type.
 */
export type ScalarIntegralName = ScalarIntegerName | ScalarFixedName | "bool";

/**
 * A Protobuf variable-length integer type.
 */
export type ScalarIntegerName = `${"u" | "s" | ""}int${"32" | "64"}`;

/**
 * A Protobuf fixed-length integer type.
 */
export type ScalarFixedName = `${"s" | ""}fixed${"32" | "64"}`;

// Symbols for type destructuring
const $scalar = Symbol("$scalar");
const $ref = Symbol("$ref");
const $map = Symbol("$map");

/**
 * A map type. Map keys can be any integral or string type (any scalar except float, double, and bytes).
 *
 * The value may be any type other than another map.
 */
export type ProtoMap = [typeof $map, ScalarIntegralName | "string", ProtoRef | ProtoScalar];

/**
 * A reference to a named message type.
 */
export type ProtoRef = [typeof $ref, string];

/**
 * A scalar type.
 */
export type ProtoScalar = [typeof $scalar, ScalarName];

/**
 * A Protobuf type.
 */
export type ProtoType = ProtoScalar | ProtoRef | ProtoMap;

/**
 * Create a scalar type by name.
 */
export function scalar(t: ScalarName): ProtoScalar {
  return [$scalar, t];
}

/**
 * Create a type reference (symbol) to a named message.
 */
export function ref(t: string): ProtoRef {
  return [$ref, t];
}

/**
 * Create a map from a key type to a value type.
 */
export function map(k: ScalarIntegralName | "string", v: Exclude<ProtoType, ProtoMap>): ProtoMap {
  return [$map, k, v];
}

/* c8 ignore start */

// Unreachable, by definition, should not be covered :)

/**
 * Creates a type that will throw an internal error if the system attempts to emit it.
 *
 * @param message - optional message that should be printed
 */
export function unreachable(message: string = "tried to emit unreachable type"): never {
  // This little "array-like" object will throw an internal error as soon as the "tag" is inspected.
  return Object.freeze({
    get [0]() {
      throw new Error("Internal Error: " + message);
    },
  }) as never;
}

/* c8 ignore stop */

/**
 * A "pattern" object with variants for each Protobuf type.
 */
export interface ProtoTypeMatchPattern<T> {
  scalar: (s: ScalarName) => T;
  ref: (r: string) => T;
  map: (k: ScalarIntegralName | "string", v: Exclude<ProtoType, ProtoMap>) => T;
}

/**
 * A helper function that matches and delegates a Protobuf type to a handler per type.
 *
 * @param type - the Protobuf type to match and delegate
 * @param pattern - the matching pattern of delegates to apply
 * @returns
 */
export function matchType<Result>(type: ProtoType, pattern: ProtoTypeMatchPattern<Result>): Result {
  switch (type[0]) {
    case $ref:
      return pattern.ref(type[1]);
    case $scalar:
      return pattern.scalar(type[1]);
    case $map:
      return pattern.map(type[1], type[2] as Exclude<ProtoType, ProtoMap>);
    /* c8 ignore next 5 */
    default:
      const __exhaust: never = type[0];
      throw new Error(`Internal Error: unreachable matchType variant ${__exhaust}`);
  }
}

/**
 * Elements common to all protobuf declarations.
 */
export interface ProtoDeclarationCommon {
  /**
   * Documentation comment text, if any.
   */
  doc?: string | undefined;
}

/**
 * A `service` declaration.
 */
export interface ProtoServiceDeclaration extends ProtoDeclarationCommon {
  kind: "service";
  name: string;
  operations: ProtoMethodDeclaration[];
}

/**
 * An operation's streaming mode.
 */
export const enum StreamingMode {
  Duplex = 3,
  In = 2,
  Out = 1,
  None = 0,
}

/**
 * An `rfc` method declaration.
 */
export interface ProtoMethodDeclaration extends ProtoDeclarationCommon {
  kind: "method";
  stream: StreamingMode;
  name: string;
  input: ProtoRef;
  returns: ProtoRef;
}

/**
 * A declaration that can fit within the body of a message declaration.
 */
export type ProtoMessageBodyDeclaration =
  | ProtoFieldDeclaration
  | ProtoMessageDeclaration
  | ProtoOneOfDeclaration
  | ProtoEnumDeclaration;

/**
 * A `message` declaration.
 */
export interface ProtoMessageDeclaration extends ProtoDeclarationCommon {
  kind: "message";
  name: string;
  declarations: Array<ProtoMessageBodyDeclaration>;
  reservations?: Array<string | number | [number, number]>;
}

/**
 * A field declaration within a message.
 */
export interface ProtoFieldDeclaration extends ProtoDeclarationCommon {
  kind: "field";
  name: string;
  /**
   * Whether or not the field is repeated (i.e. an array).
   */
  repeated?: boolean;
  options?: Partial<DefaultFieldOptions>;
  type: ProtoType;
  index: number;
}

/**
 * The options for fields defined by the Protobuf specification.
 */
export interface DefaultFieldOptions {
  packed: true;
  deprecated: true;
}

/**
 * A `one_of` declaration.
 */
export interface ProtoOneOfDeclaration extends ProtoDeclarationCommon {
  kind: "oneof";
  name: string;
  declarations: ProtoFieldDeclaration[];
}

/**
 * An `enum` declaration.
 */
export interface ProtoEnumDeclaration extends ProtoDeclarationCommon {
  kind: "enum";
  name: string;
  allowAlias?: boolean;
  variants: ProtoEnumVariantDeclaration[];
}

/**
 * A variant within an `enum` declaration.
 */
export interface ProtoEnumVariantDeclaration extends ProtoDeclarationCommon {
  kind: "variant";
  name: string;
  value: number;
}
