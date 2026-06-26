import "@typespec/compiler/emitter";

/**
 * Json schema emitter options
 */
model EmitterOptions {
  /**
   * Serialize the schema as either yaml or json.
   * @defaultValue yaml it not specified infer from the `output-file` extension
   */
  `file-type`?: FileType;

  /**
   * How to handle 64-bit integers on the wire. Options are:
   *
   * - string: Serialize as a string (widely interoperable)
   * - number: Serialize as a number (not widely interoperable)
   */
  `int64-strategy`?: Int64Strategy;

  /**
   * When provided, bundle all the schemas into a single JSON Schema document
   * with schemas under $defs. The provided id is the id of the root document
   * and is also used for the file name.
   */
  bundleId?: string;

  /**
   * When true, emit all model declarations to JSON Schema without requiring
   * the `@jsonSchema` decorator.
   */
  emitAllModels?: boolean;

  /**
   * When true, emit all references as JSON Schema files, even if the referenced
   * type does not have the `@jsonSchema` decorator or is not within a namespace
   * with the `@jsonSchema` decorator.
   */
  emitAllRefs?: boolean;

  /**
   * If true, then for models emitted as object schemas we default `unevaluatedProperties` to `{ not: {} }`,
   * if not explicitly specified elsewhere.
   * @defaultValue false
   */
  `seal-object-schemas`?: boolean;

  /**
   * Strategy for emitting models with the discriminator decorator.
   * - ignore: Emit as regular object schema (default)
   * - oneOf: Emit a oneOf schema with references to all derived models (closed union)
   * - anyOf: Emit an anyOf schema with references to all derived models (open union)
   * @defaultValue "ignore"
   */
  `polymorphic-models-strategy`?: PolymorphicModelsStrategy;
}

/**
 * File type
 */
alias FileType = "yaml" | "json";

/**
 * Strategy for handling the int64 type in the resulting json schema.
 * - string: As a string
 * - number: As a number (In JavaScript, int64 cannot be accurately represented as number)
 *
 */
alias Int64Strategy = "string" | "number";

/**
 * Strategy for emitting models with the `@discriminator` decorator.
 * - ignore: Emit as regular object schema (default)
 * - oneOf: Emit a oneOf schema with references to all derived models (closed union)
 * - anyOf: Emit an anyOf schema with references to all derived models (open union)
 */
alias PolymorphicModelsStrategy = "ignore" | "oneOf" | "anyOf";
