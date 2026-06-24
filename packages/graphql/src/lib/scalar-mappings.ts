import { type IntrinsicScalarName, type Program, type Scalar } from "@typespec/compiler";
import { $, type Typekit } from "@typespec/compiler/typekit";

/**
 * Represents a mapping from a TypeSpec standard library scalar to a GraphQL custom scalar.
 */
export interface ScalarMapping {
  /** The GraphQL scalar name to emit */
  graphqlName: string;
  /** The base GraphQL type (String, Int, or Float) */
  baseType: "String" | "Int" | "Float" | "Boolean" | "ID";
  /** Optional URL to specification for @specifiedBy directive */
  specificationUrl?: string;
}

/**
 * Mapping table for TypeSpec standard library scalars to GraphQL custom scalars.
 *
 * Built-in scalars (string, boolean, int32, float64, etc.) are NOT included here —
 * they map directly to GraphQL built-in types and are resolved at emit time.
 * This table only covers scalars that need to become custom GraphQL scalar types.
 */
const SCALAR_MAPPINGS = {
  // int64 → Long (String)
  int64: {
    default: {
      graphqlName: "Long",
      baseType: "String",
      specificationUrl: "http://scalars.graphql.org/jakobmerrild/long.html",
    },
  },

  // numeric → Numeric (String)
  numeric: {
    default: {
      graphqlName: "Numeric",
      baseType: "String",
    },
  },

  // decimal, decimal128 → BigDecimal (String)
  decimal: {
    default: {
      graphqlName: "BigDecimal",
      baseType: "String",
      specificationUrl: "https://scalars.graphql.org/chillicream/decimal.html",
    },
  },
  decimal128: {
    default: {
      graphqlName: "BigDecimal",
      baseType: "String",
      specificationUrl: "https://scalars.graphql.org/chillicream/decimal.html",
    },
  },

  // bytes — requires @encode to determine format; without encoding, no GraphQL mapping applies
  bytes: {
    base64: {
      graphqlName: "Bytes",
      baseType: "String",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc4648#section-4",
    },
    base64url: {
      graphqlName: "BytesUrl",
      baseType: "String",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc4648#section-5",
    },
  },

  // utcDateTime — requires @encode to determine wire format; no default mapping without encoding
  utcDateTime: {
    rfc3339: {
      graphqlName: "UTCDateTime",
      baseType: "String",
      specificationUrl: "https://scalars.graphql.org/chillicream/date-time.html",
    },
    rfc7231: {
      graphqlName: "UTCDateTimeHuman",
      baseType: "String",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc7231#section-7.1.1.1",
    },
    unixTimestamp: {
      graphqlName: "UTCDateTimeUnix",
      baseType: "Int",
    },
  },

  // offsetDateTime — requires @encode to determine wire format; no default mapping without encoding
  offsetDateTime: {
    rfc3339: {
      graphqlName: "OffsetDateTime",
      baseType: "String",
      specificationUrl: "https://scalars.graphql.org/chillicream/date-time.html",
    },
    rfc7231: {
      graphqlName: "OffsetDateTimeHuman",
      baseType: "String",
      specificationUrl: "https://datatracker.ietf.org/doc/html/rfc7231#section-7.1.1.1",
    },
    unixTimestamp: {
      graphqlName: "OffsetDateTimeUnix",
      baseType: "Int",
    },
  },

  // duration — requires @encode to determine wire format; no default mapping without encoding
  duration: {
    ISO8601: {
      graphqlName: "Duration",
      baseType: "String",
      specificationUrl: "https://www.iso.org/standard/70907.html",
    },
    seconds: {
      graphqlName: "DurationSeconds",
      baseType: "Int", // Could be Float based on context, defaulting to Int
    },
  },

  // plainDate → PlainDate (String)
  plainDate: {
    default: {
      graphqlName: "PlainDate",
      baseType: "String",
      specificationUrl: "https://scalars.graphql.org/andimarek/local-date.html",
    },
  },

  // plainTime → PlainTime (String)
  plainTime: {
    default: {
      graphqlName: "PlainTime",
      baseType: "String",
      specificationUrl: "https://scalars.graphql.org/apollographql/localtime-v0.1.html",
    },
  },

  // url → URL (String)
  url: {
    default: {
      graphqlName: "URL",
      baseType: "String",
      specificationUrl: "https://url.spec.whatwg.org/",
    },
  },
} as const;

type MappedScalarName = keyof typeof SCALAR_MAPPINGS;

/**
 * Check whether a scalar IS a standard library scalar (not just extends one).
 * A std scalar's std base is itself. A user-defined scalar's std base is
 * its ancestor (or null if it has no std ancestor).
 */
export function isStdScalar(tk: Typekit, scalar: Scalar): boolean {
  return tk.scalar.getStdBase(scalar) === scalar;
}

/**
 * TypeSpec std scalar names that map directly to GraphQL built-in scalar types:
 * string → String, boolean → Boolean, int32 → Int, float32/float64 → Float.
 *
 * These must NOT be renamed by the scalar mutation — they're resolved to
 * GraphQL builtins at emit time.
 *
 * @see https://spec.graphql.org/September2025/#sec-Scalars.Built-in-Scalars
 */
const TSP_SCALARS_TO_GQL_BUILTINS: IntrinsicScalarName[] = [
  "string",
  "boolean",
  "int32",
  "float32",
  "float64",
];

/**
 * Get the GraphQL scalar mapping for a scalar via its standard library ancestor.
 *
 * Uses `tk.scalar.getStdBase()` to find the std ancestor (e.g. `int64` for
 * `scalar MyInt extends int64`), then looks up the mapping table by name.
 * Returns undefined for scalars with no mapped ancestor.
 *
 * Note: this returns a mapping even for GraphQL builtins like `float32`
 * (which inherits a mapping from `numeric`). Use {@link getCustomScalarMapping}
 * when you need a mapping that should trigger renaming — it filters out builtins.
 *
 * @param program The TypeSpec program
 * @param scalar The scalar type to map
 * @param encoding Optional encoding to use instead of checking @encode on the scalar
 * @returns The scalar mapping or undefined if no mapping exists
 */
export function getScalarMapping(
  program: Program,
  scalar: Scalar,
  encoding?: string,
): ScalarMapping | undefined {
  return getScalarMappingInternal($(program), scalar, encoding);
}

/**
 * Get the GraphQL custom scalar mapping for a standard library scalar —
 * i.e., a mapping that should trigger renaming.
 *
 * Returns undefined for:
 * - Scalars with no mapped ancestor
 * - GraphQL builtins (string, boolean, int32, float32, float64) that should
 *   NOT be renamed even though they inherit a mapping via the extends chain
 *   (e.g. float32 → float → numeric → "Numeric")
 * - Non-std scalars (user-defined scalars keep their own name)
 *
 * @param program The TypeSpec program
 * @param scalar The scalar type to map (must be a std scalar)
 * @returns The scalar mapping or undefined if the scalar shouldn't be renamed
 */
export function getCustomScalarMapping(
  program: Program,
  scalar: Scalar,
): ScalarMapping | undefined {
  const tk = $(program);
  if (!isStdScalar(tk, scalar)) return undefined;
  if (TSP_SCALARS_TO_GQL_BUILTINS.some((name) => program.checker.isStdType(scalar, name)))
    return undefined;
  return getScalarMappingInternal(tk, scalar);
}

function getScalarMappingInternal(
  tk: Typekit,
  scalar: Scalar,
  encoding?: string,
): ScalarMapping | undefined {
  // getStdBase walks the baseScalar chain and returns the first ancestor
  // in the TypeSpec namespace (identity-safe, not name-based).
  const stdBase = tk.scalar.getStdBase(scalar);
  if (!stdBase || !(stdBase.name in SCALAR_MAPPINGS)) {
    return undefined;
  }

  const mappingTable = SCALAR_MAPPINGS[stdBase.name as MappedScalarName];
  if (!mappingTable) {
    return undefined;
  }

  // Encoding is checked on the original scalar, not the ancestor.
  const actualEncoding = encoding ?? tk.scalar.getEncoding(scalar)?.encoding;
  if (actualEncoding) {
    const encodingMapping = (mappingTable as Record<string, ScalarMapping>)[actualEncoding];
    if (encodingMapping) {
      return encodingMapping;
    }
  }

  // Fall back to default mapping (not all mapping tables have a default)
  return "default" in mappingTable
    ? (mappingTable as Record<string, ScalarMapping>).default
    : undefined;
}
