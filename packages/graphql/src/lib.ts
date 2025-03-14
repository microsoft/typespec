import { createTypeSpecLibrary, paramMessage, type JSONSchemaType } from "@typespec/compiler";

export const NAMESPACE = "TypeSpec.GraphQL";

export interface GraphQLEmitterOptions {
  /**
   * Name of the output file.
   * Output file will interpolate the following values:
   * - schema-name: Name of the schema if multiple
   *
   * @default `{schema-name}.graphql`
   *
   * @example Single schema
   * - `schema.graphql`
   *
   * @example Multiple schemas
   * - `Org1.Schema1.graphql`
   * - `Org1.Schema2.graphql`
   */
  "output-file"?: string;

  /**
   * Set the newline character for emitting files.
   * @default lf
   */
  "new-line"?: "crlf" | "lf";

  /**
   * Omit unreachable types.
   * By default all types declared under the schema namespace will be included. With this flag on only types references in an operation will be emitted.
   * @default false
   */
  "omit-unreachable-types"?: boolean;

  /**
   * Only emit types if a correct GraphQL translation type is found. Don't emit Any types and operations that don't have the GraphQL decorators.
   * By default a best effort is made to emit all types.
   * @default false
   */
  strict?: boolean;
}

const EmitterOptionsSchema: JSONSchemaType<GraphQLEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-file": {
      type: "string",
      nullable: true,
      description: [
        "Name of the output file.",
        " Output file will interpolate the following values:",
        " - schema-name: Name of the schema if multiple",
        "",
        " Default: `{schema-name}.graphql`",
        "",
        " Example Single schema",
        " - `schema.graphql`",
        "",
        " Example Multiple schemas",
        " - `Org1.Schema1.graphql`",
        " - `Org1.Schema2.graphql`",
      ].join("\n"),
    },
    "new-line": {
      type: "string",
      enum: ["crlf", "lf"],
      default: "lf",
      nullable: true,
      description: "Set the newLine character for emitting files.",
    },
    "omit-unreachable-types": {
      type: "boolean",
      nullable: true,
      description: [
        "Omit unreachable types.",
        "By default all types declared under the schema namespace will be included.",
        "With this flag on only types references in an operation will be emitted.",
      ].join("\n"),
    },
    strict: {
      type: "boolean",
      nullable: true,
      description: [
        "Only emit types if a correct GraphQL translation type is found.",
        "Don't emit Any types and operations that don't have the GraphQL decorators.",
        "By default a best effort is made to emit all types.",
      ].join("\n"),
    },
  },
  required: [],
};

export const libDef = {
  name: "@typespec/graphql",
  diagnostics: {
    "graphql-operation-kind-duplicate": {
      severity: "error",
      messages: {
        default: paramMessage`GraphQL Operation Kind already applied to \`${"entityName"}\`.`,
      },
    },    
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<GraphQLEmitterOptions>,
  },
  state: {
    operationKind: {
      description:
        "State for the graphql operation kind decorators (@query, @mutation, @subscription)",
    },    
    schema: { description: "State for the @schema decorator." },
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);

export const { reportDiagnostic, createDiagnostic, stateKeys: GraphQLKeys } = $lib;
