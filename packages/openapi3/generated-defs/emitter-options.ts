export interface EmitterOptions {
  /**
   * If the content should be serialized as YAML or JSON.
   * Can be a single value or an array to emit multiple formats.
   * Default `yaml`, if not specified infer from the `output-file` extension.
   */
  "file-type"?: "yaml" | "json" | ("yaml" | "json")[];
  /**
   * Name of the output file.
   * Output file will interpolate the following values:
   * - service-name: Name of the service
   * - service-name-if-multiple: Name of the service if multiple
   * - version: Version of the service if multiple
   * - file-type: The file type being emitted (json or yaml). Useful when `file-type` is an array.
   *
   * Default: `{service-name-if-multiple}.{version}.openapi.yaml` or `.json` if `file-type` is `"json"`.
   * When `file-type` is an array: `{service-name-if-multiple}.{version}.openapi.{file-type}`.
   */
  "output-file"?: string;
  /**
   * The Open API specification versions to emit.
   * If more than one version is specified, then the output file
   * will be created inside a directory matching each specification version.
   */
  "openapi-versions"?: ("3.0.0" | "3.1.0" | "3.2.0")[];
  /**
   * Set the newline character for emitting files.
   */
  "new-line"?: "crlf" | "lf";
  /**
   * Omit unreachable types.
   * By default all types declared under the service namespace will be included. With this flag on only types references in an operation will be emitted.
   */
  "omit-unreachable-types"?: boolean;
  /**
   * If the generated openapi types should have the `x-typespec-name` extension set with the name of the TypeSpec type that created it.
   * This extension is meant for debugging and should not be depended on.
   */
  "include-x-typespec-name"?: "inline-only" | "never";
  /**
   * How to handle safeint type. Options are:
   * - `double-int`: Will produce `type: integer, format: double-int`
   * - `int64`: Will produce `type: integer, format: int64`
   */
  "safeint-strategy"?: "double-int" | "int64";
  /**
   * If true, then for models emitted as object schemas we default `additionalProperties` to false for
   * OpenAPI 3.0, and `unevaluatedProperties` to false for OpenAPI 3.1, if not explicitly specified elsewhere.
   */
  "seal-object-schemas"?: boolean;
  /**
   * Determines how to emit examples on parameters.
   *
   * Note: This is an experimental feature and may change in future versions.
   */
  "experimental-parameter-examples"?: "data" | "serialized";
  /**
   * How should operation ID be generated when `@operationId` is not used.
   * Available options are
   * - `parent-container`: Uses the parent namespace/interface and operation name to generate the ID.
   * - `fqn`: Uses the fully qualified name(from service root) of the operation to generate the ID.
   * - `explicit-only`: Only use explicitly defined operation IDs.
   */
  "operation-id-strategy"?:
    | "parent-container"
    | "fqn"
    | "explicit-only"
    | {
        /**
         * Strategy used to generate the operation ID.
         */
        kind: "parent-container" | "fqn" | "explicit-only";
        /**
         * Separator used to join segment in the operation name.
         */
        separator?: string;
      };
  /**
   * How to emit TypeSpec enums. Options are:
   * - `default`: Emit as a single schema using the `enum` keyword.
   * - `annotated`: Emit as a `oneOf` of `const` subschemas annotated with `title` and `description`
   * from each member's `@summary` and `@doc`. Only supported by OpenAPI 3.1.0 and above.
   */
  "enum-strategy"?: "default" | "annotated";
}
