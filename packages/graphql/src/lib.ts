import { createTypeSpecLibrary, paramMessage, type JSONSchemaType } from "@typespec/compiler";

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
    "operation-field-conflict": {
      severity: "error",
      messages: {
        default: paramMessage`Operation \`${"operation"}\` conflicts with an existing ${"conflictType"} on model \`${"model"}\`.`,
      },
    },
    "operation-field-duplicate": {
      severity: "warning",
      messages: {
        default: paramMessage`Operation \`${"operation"}\` is defined multiple times on \`${"model"}\`.`,
      },
    },
    "invalid-interface": {
      severity: "error",
      messages: {
        default: paramMessage`All models used with \`@compose\` must be marked with \`@graphqlInterface\`, but ${"interface"} is not.`,
      },
    },
    "circular-interface": {
      severity: "error",
      messages: {
        default: "An interface cannot implement itself.",
      },
    },
    "missing-interface-property": {
      severity: "error",
      messages: {
        default: paramMessage`Model must contain property \`${"property"}\` from \`${"interface"}\` in order to implement it in GraphQL.`,
      },
    },
    "incompatible-interface-property": {
      severity: "error",
      messages: {
        default: paramMessage`Property \`${"property"}\` is incompatible with \`${"interface"}\`.`,
      },
    },
    "unrecognized-union": {
      severity: "error",
      messages: {
        default:
          "Unrecognized union construction. Union must be named, a return type, a model property, or an alias.",
      },
    },
    "duplicate-union-variant": {
      severity: "warning",
      messages: {
        default: paramMessage`Union variant type "${"type"}" appears multiple times after flattening nested unions. Duplicate removed.`,
      },
    },
    "empty-union": {
      severity: "error",
      messages: {
        default:
          "Union has no non-null variants. A GraphQL union must contain at least one member type.",
      },
    },
    "graphql-builtin-scalar-collision": {
      severity: "warning",
      messages: {
        default: paramMessage`Scalar "${"name"}" collides with GraphQL built-in type "${"builtinName"}". This may cause unexpected behavior. Consider renaming the scalar.`,
      },
    },
    "type-name-collision": {
      severity: "error",
      messages: {
        default: paramMessage`Type "${"name"}" collides with another type of the same name in the GraphQL schema. Consider renaming one of the types.`,
      },
    },
    "operation-fields-ignored-on-input": {
      severity: "warning",
      messages: {
        default: paramMessage`@operationFields on \`${"model"}\` is ignored in input context — GraphQL input types cannot have operation fields.`,
      },
    },
    "empty-schema": {
      severity: "warning",
      messages: {
        default: "GraphQL schema has no operations. At minimum a Query root type is required.",
      },
    },
    "empty-enum": {
      severity: "error",
      messages: {
        default: paramMessage`Enum "${"name"}" must define at least one value. GraphQL enums cannot be empty.`,
      },
    },
    "reserved-name": {
      severity: "error",
      messages: {
        default: paramMessage`Name "${"name"}" must not begin with "__" (two underscores), which is reserved by GraphQL for introspection.`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<GraphQLEmitterOptions>,
    capabilities: {
      dryRun: true,
    },
  },
  state: {
    operationKind: {
      description:
        "State for the graphql operation kind decorators (@query, @mutation, @subscription)",
    },
    operationFields: { description: "State for the @operationFields decorator." },
    compose: { description: "State for the @compose decorator." },
    interface: { description: "State for the @interface decorator." },
    interfaceOnly: { description: "State for @interface(#{interfaceOnly: true})." },
    schema: { description: "State for the @schema decorator." },
    specifiedBy: { description: "State for the @specifiedBy decorator." },
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);

export const { reportDiagnostic, createDiagnostic, stateKeys: GraphQLKeys } = $lib;
