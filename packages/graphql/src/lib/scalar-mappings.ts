import { type IntrinsicScalarName, type Program, type Scalar } from "@typespec/compiler";
import { $, type Typekit } from "@typespec/compiler/typekit";

type GraphQLBuiltinScalar = "String" | "Int" | "Float" | "Boolean" | "ID";

/**
 * Represents a mapping from a TypeSpec scalar to GraphQL.
 */
export interface ScalarMapping {
  /** The GraphQL type to use for field references (String, Int, Float, Boolean, ID) */
  graphqlType: GraphQLBuiltinScalar;
  /** Optional custom scalar name for explicit scalar definitions */
  customScalarName?: string;
  /** Optional URL to specification for @specifiedBy directive */
  specificationUrl?: string;
}

/**
 * Mapping table for all TypeSpec standard library scalars to GraphQL.
 *
 * Each scalar has:
 * - A `default` entry with `graphqlType` for field type resolution
 * - Optional encoding-specific entries for custom scalar emission
 *
 * Every IntrinsicScalarName must have an entry here - the type system enforces this.
 */
const SCALAR_MAPPINGS: Record<IntrinsicScalarName | "ID", Record<string, ScalarMapping>> = {
  // GraphQL built-in scalars (direct mapping, no custom scalar needed)
  string: {
    default: { graphqlType: "String" },
  },
  boolean: {
    default: { graphqlType: "Boolean" },
  },
  int32: {
    default: { graphqlType: "Int" },
  },
  float32: {
    default: { graphqlType: "Float" },
  },
  float64: {
    default: { graphqlType: "Float" },
  },

  // Integer types that fit in GraphQL Int
  int8: {
    default: { graphqlType: "Int" },
  },
  int16: {
    default: { graphqlType: "Int" },
  },
  uint8: {
    default: { graphqlType: "Int" },
  },
  uint16: {
    default: { graphqlType: "Int" },
  },

  // Integer types that exceed GraphQL Int range
  int64: {
    default: {
      graphqlType: "String",
      customScalarName: "Long",
      specificationUrl: "http://scalars.graphql.org/jakobmerrild/long.html",
    },
  },
  uint32: {
    default: { graphqlType: "String" },
  },
  uint64: {
    default: { graphqlType: "String" },
  },
  safeint: {
    default: { graphqlType: "String" },
  },
  integer: {
    default: { graphqlType: "String" },
  },

  // Numeric/decimal types
  numeric: {
    default: {
      graphqlType: "String",
      customScalarName: "Numeric",
    },
  },
  float: {
    default: { graphqlType: "Float" },
  },
  decimal: {
    default: {
      graphqlType: "String",
      customScalarName: "BigDecimal",
      specificationUrl: "https://scalars.graphql.org/chillicream/decimal.html",
    },
  },
  decimal128: {
    default: {
      graphqlType: "String",
      customScalarName: "BigDecimal",
      specificationUrl: "https://scalars.graphql.org/chillicream/decimal.html",
    },
  },

  // Date/time types
  plainDate: {
    default: {
      graphqlType: "String",
      customScalarName: "PlainDate",
      specificationUrl: "https://scalars.graphql.org/andimarek/local-date.html",
    },
  },
  plainTime: {
    default: {
      graphqlType: "String",
      customScalarName: "PlainTime",
      specificationUrl: "https://scalars.graphql.org/apollographql/localtime-v0.1.html",
    },
  },
  utcDateTime: {
    default: { graphqlType: "String" },
    rfc3339: {
      graphqlType: "String",
      customScalarName: "UTCDateTime",
      specificationUrl: "https://scalars.graphql.org/chillicream/date-time.html",
    },
    rfc7231: {
      graphqlType: "String",
      customScalarName: "UTCDateTimeHuman",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc7231#section-7.1.1.1",
    },
    unixTimestamp: {
      graphqlType: "Int",
      customScalarName: "UTCDateTimeUnix",
    },
  },
  offsetDateTime: {
    default: { graphqlType: "String" },
    rfc3339: {
      graphqlType: "String",
      customScalarName: "OffsetDateTime",
      specificationUrl: "https://scalars.graphql.org/chillicream/date-time.html",
    },
    rfc7231: {
      graphqlType: "String",
      customScalarName: "OffsetDateTimeHuman",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc7231#section-7.1.1.1",
    },
    unixTimestamp: {
      graphqlType: "Int",
      customScalarName: "OffsetDateTimeUnix",
    },
  },
  duration: {
    default: { graphqlType: "String" },
    ISO8601: {
      graphqlType: "String",
      customScalarName: "Duration",
      specificationUrl: "https://www.iso.org/standard/70907.html",
    },
    seconds: {
      graphqlType: "Int",
      customScalarName: "DurationSeconds",
    },
  },

  // Other types
  bytes: {
    default: { graphqlType: "String" },
    base64: {
      graphqlType: "String",
      customScalarName: "Bytes",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc4648#section-4",
    },
    base64url: {
      graphqlType: "String",
      customScalarName: "BytesUrl",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc4648#section-5",
    },
  },
  url: {
    default: {
      graphqlType: "String",
      customScalarName: "URL",
      specificationUrl: "https://url.spec.whatwg.org/",
    },
  },

  // GraphQL library scalar (TypeSpec.GraphQL.ID)
  ID: {
    default: { graphqlType: "ID" },
  },
};

/**
 * Check whether a scalar IS a standard library scalar (not just extends one).
 */
export function isStdScalar(tk: Typekit, scalar: Scalar): boolean {
  return tk.scalar.getStdBase(scalar) === scalar;
}

/**
 * Resolve a TypeSpec scalar name to its GraphQL type.
 * Returns the mapped GraphQL built-in type, or the original name for user-defined scalars.
 */
export function resolveScalarToGraphQL(scalarName: string): string {
  const mapping = (SCALAR_MAPPINGS as Record<string, Record<string, ScalarMapping>>)[scalarName];
  return mapping?.default?.graphqlType ?? scalarName;
}

/**
 * Get the full scalar mapping for a scalar, including encoding-specific mappings.
 * Used for @specifiedBy inheritance when users define custom scalars.
 */
export function getScalarMapping(
  program: Program,
  scalar: Scalar,
  encoding?: string,
): ScalarMapping | undefined {
  const tk = $(program);
  const stdBase = tk.scalar.getStdBase(scalar);
  if (!stdBase) return undefined;

  const mappingTable = (SCALAR_MAPPINGS as Record<string, Record<string, ScalarMapping>>)[
    stdBase.name
  ];
  if (!mappingTable) return undefined;

  // Check encoding-specific mapping first
  const actualEncoding = encoding ?? tk.scalar.getEncoding(scalar)?.encoding;
  if (actualEncoding && mappingTable[actualEncoding]) {
    return mappingTable[actualEncoding];
  }

  return mappingTable.default;
}
