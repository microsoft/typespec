import { Numeric, printIdentifier } from "@typespec/compiler";
import type {
  OpenAPI3Example,
  OpenAPI3MediaType,
  Refable,
  SupportedOpenAPISchema,
} from "../../../../types.js";
import type { TypeSpecModelProperty } from "../interfaces.js";
import { getTypeSpecKind } from "../transforms/transform-component-schemas.js";
import type { Context } from "../utils/context.js";
import { isValidLiteralStatusCode } from "../utils/response-properties.js";
import { getTypeSpecPrimitiveFromSchema } from "./generate-types.js";

export interface ResponseExampleShape {
  statusCode: string;
  mediaType: string;
  content: OpenAPI3MediaType;
  /** The properties actually emitted on the response envelope, if any. */
  properties: TypeSpecModelProperty[];
  /** The schema of an implicit body (including a response returned directly). */
  implicitBody?: Refable<SupportedOpenAPISchema>;
  unsupportedReason?: string;
}

export function generateResponseExamples(
  shape: ResponseExampleShape,
  scope: string[],
  context: Context,
): string[] {
  const { content, statusCode, mediaType } = shape;
  const warn = (key: string | undefined, reason: string) =>
    context.logger.warn(
      `Cannot import response example '${key ?? "<unnamed>"}' for ${statusCode}/${mediaType}: ${reason}`,
    );
  // Neither field is truth-tested: null, false, zero, and "" are payloads.
  if ("example" in content && "examples" in content) {
    warn(undefined, "example and examples are mutually exclusive; skipping this media type.");
    return [];
  }
  const entries: [string | undefined, Refable<OpenAPI3Example>][] =
    "example" in content
      ? [[undefined, { value: content.example }]]
      : Object.entries(content.examples ?? {});

  const decorators: string[] = [];
  for (const [key, entry] of entries) {
    try {
      if (shape.unsupportedReason) throw new Error(shape.unsupportedReason);
      const example = resolveExample(entry, context);
      if (!Object.hasOwn(example, "value")) {
        throw new Error("only Example Objects with an inline value are supported.");
      }
      const value = generateResponseExampleValue(example.value, shape, scope, context);
      const options = [
        ...(key !== undefined ? [`title: ${quote(key)}`] : []),
        ...(example.description !== undefined
          ? [`description: ${quote(example.description)}`]
          : []),
      ];
      // Do not use generateDecorators: it deduplicates repeatable decorators.
      decorators.push(
        `@opExample(#{ returnType: ${value} }${options.length ? `, #{ ${options.join(", ")} }` : ""})`,
      );
    } catch (error) {
      warn(key, error instanceof Error ? error.message : String(error));
    }
  }
  return decorators;
}

function resolveExample(entry: Refable<OpenAPI3Example>, context: Context): OpenAPI3Example {
  const seen = new Set<string>();
  while ("$ref" in entry) {
    const ref = entry.$ref;
    if (!ref.startsWith("#/components/examples/") || seen.has(ref)) {
      throw new Error(`unsupported or cyclic Example Object reference: ${ref}`);
    }
    seen.add(ref);
    const resolved = context.getByRef<Refable<OpenAPI3Example>>(ref);
    if (!resolved) throw new Error(`unresolved Example Object reference: ${ref}`);
    entry = resolved;
  }
  return entry;
}

export function generateResponseExampleValue(
  payload: unknown,
  shape: ResponseExampleShape,
  scope: string[],
  context: Context,
): string {
  const body = shape.properties.find((p) =>
    p.decorators.some((d) => d.name === "body" || d.name === "bodyRoot"),
  );
  const schema = body?.schema ?? shape.implicitBody;
  if (!schema) throw new Error("the generated response has no representable body.");
  const value = generateExampleValue(payload, schema, scope, context);
  const properties: string[] = [];
  if (body) {
    properties.push(`${body.name}: ${value}`);
  } else if (shape.properties.length === 0) {
    return value;
  } else {
    // Implicit body properties and HTTP metadata are independent.
    if (!value.startsWith("#{")) {
      throw new Error("the generated implicit response body is not an object.");
    }
    const bodyProperties = value.slice(2, -1).trim();
    if (bodyProperties) properties.push(bodyProperties);
    if (
      payload !== null &&
      typeof payload === "object" &&
      shape.properties.some((p) =>
        Object.keys(payload).some((key) => key === p.name || printIdentifier(key) === p.name),
      )
    ) {
      throw new Error("payload properties collide with generated response metadata.");
    }
  }
  for (const property of shape.properties) {
    if (property === body) continue;
    if (property.decorators.some((d) => d.name === "statusCode")) {
      if (!isValidLiteralStatusCode(shape.statusCode)) {
        throw new Error("a status range cannot select an example without guessing a status.");
      }
      properties.push(`${property.name}: ${Number(shape.statusCode)}`);
    } else if (isContentType(property)) {
      properties.push(`${property.name}: ${quote(shape.mediaType)}`);
    } else if (!property.isOptional) {
      throw new Error(`required response header '${property.name}' has no example value.`);
    }
  }
  return `#{ ${properties.join(", ")} }`;
}

function isContentType(property: TypeSpecModelProperty): boolean {
  return property.decorators.some(
    (d) =>
      d.name === "header" &&
      (typeof d.args[0] === "string"
        ? d.args[0].toLowerCase() === "content-type"
        : property.name === "contentType"),
  );
}

/** JSON escaping plus TypeSpec's additional string-interpolation escaping. */
function quote(value: string): string {
  return JSON.stringify(value).replaceAll("${", "\\${");
}

function generateExampleValue(
  value: unknown,
  schema: Refable<SupportedOpenAPISchema>,
  scope: string[],
  context: Context,
  depth = 0,
  scalarName?: string,
): string {
  const invalid = () => {
    throw new Error("payload cannot be represented in the generated response type.");
  };
  if (depth > 100) return invalid();
  const convert = (v: unknown, s: Refable<SupportedOpenAPISchema>) =>
    generateExampleValue(v, s, scope, context, depth + 1);
  if ("$ref" in schema) {
    const resolved = context.getSchemaByRef(schema.$ref);
    if (!resolved) return invalid();
    if (value === null && getTypeSpecKind(resolved) === "model") return invalid();
    const expression = generateExampleValue(
      value,
      resolved,
      scope,
      context,
      depth + 1,
      getTypeSpecKind(resolved) === "scalar" ? context.getRefName(schema.$ref, scope) : undefined,
    );
    // String enums become nominal TypeSpec enums, not string literal unions.
    if (
      resolved.type === "string" &&
      resolved.enum &&
      !("nullable" in resolved && resolved.nullable)
    ) {
      return `${context.getRefName(schema.$ref, scope)}.${printIdentifier(String(value), "disallow-reserved")}`;
    }
    return expression;
  }
  if (value === null) {
    if (
      ("nullable" in schema && schema.nullable) ||
      schema.type === "null" ||
      (Array.isArray(schema.type) && schema.type.includes("null")) ||
      [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])].some((s) => {
        try {
          return convert(null, s) === "null";
        } catch {
          return false;
        }
      }) ||
      schema.const === null ||
      schema.enum?.includes(null as never) ||
      context.generateTypeFromRefableSchema(schema, scope) === "unknown"
    ) {
      return "null";
    }
    return invalid();
  }
  if (schema.enum && !schema.enum.includes(value as never)) return invalid();
  if ("const" in schema && schema.const !== undefined && schema.const !== value) return invalid();
  if (schema.enum || schema.const !== undefined) {
    if (typeof value === "string") return quote(value);
    if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) {
      return JSON.stringify(value);
    }
    return invalid();
  }

  if (schema.anyOf?.length || schema.oneOf?.length) {
    for (const member of schema.anyOf ?? schema.oneOf ?? []) {
      try {
        return convert(value, member);
      } catch {
        // Try the next generated union variant.
      }
    }
    return invalid();
  }
  if (schema.allOf?.length) {
    // Object intersections combine their properties and required lists.
    let properties: Record<string, Refable<SupportedOpenAPISchema>> = {
      ...schema.properties,
    };
    const indexers: Refable<SupportedOpenAPISchema>[] = [];
    if (typeof schema.additionalProperties === "object") indexers.push(schema.additionalProperties);
    let allowsAdditionalProperties = !!schema.additionalProperties;
    const required = new Set(schema.required);
    const collect = (s: Refable<SupportedOpenAPISchema>, seen = new Set<string>()): void => {
      if ("$ref" in s) {
        if (seen.has(s.$ref)) return invalid();
        seen.add(s.$ref);
        const resolved = context.getSchemaByRef(s.$ref);
        if (!resolved) return invalid();
        return collect(resolved, seen);
      }
      properties = { ...properties, ...s.properties };
      if (s.additionalProperties) {
        allowsAdditionalProperties = true;
        if (typeof s.additionalProperties === "object") indexers.push(s.additionalProperties);
      }
      for (const key of s.required ?? []) required.add(key);
      for (const member of s.allOf ?? []) collect(member, new Set(seen));
    };
    for (const member of schema.allOf) collect(member);
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      for (const item of Object.values(value)) {
        const expressions = indexers.map((indexer) => convert(item, indexer));
        if (new Set(expressions).size > 1) return invalid();
      }
    }
    return convert(value, {
      ...schema,
      allOf: undefined,
      properties,
      required: [...required],
      additionalProperties: indexers[0] ?? allowsAdditionalProperties,
    } as SupportedOpenAPISchema);
  }

  const declaredType = Array.isArray(schema.type)
    ? schema.type.find((t) => t !== "null")
    : schema.type;
  const type = schema.items
    ? "array"
    : schema.properties || schema.additionalProperties
      ? "object"
      : declaredType;
  if (Array.isArray(value)) {
    if (type && type !== "array") return invalid();
    if (
      (schema.minItems !== undefined && value.length < schema.minItems) ||
      (schema.maxItems !== undefined && value.length > schema.maxItems)
    )
      return invalid();
    return `#[${value.map((item) => convert(item, schema.items ?? {})).join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    if (type && type !== "object") return invalid();
    const values = value as Record<string, unknown>;
    if ((schema.required ?? []).some((key) => !Object.hasOwn(values, key))) return invalid();
    const properties = Object.entries(values).map(([key, item]) => {
      const knownProperty = Object.hasOwn(schema.properties ?? {}, key);
      const itemSchema = knownProperty
        ? (schema.properties?.[key] ?? {})
        : typeof schema.additionalProperties === "object"
          ? schema.additionalProperties
          : {};
      if (!knownProperty && type === "object" && !schema.additionalProperties) {
        return invalid();
      }
      return `${printIdentifier(key)}: ${convert(item, itemSchema)}`;
    });
    return `#{ ${properties.join(", ")} }`;
  }
  if (typeof value === "string") {
    if (type && type !== "string") return invalid();
    if (
      (schema.minLength !== undefined && value.length < schema.minLength) ||
      (schema.maxLength !== undefined && value.length > schema.maxLength)
    )
      return invalid();
    const primitive = getTypeSpecPrimitiveFromSchema({ ...schema, type: "string" });
    switch (primitive) {
      case "utcDateTime":
      case "plainDate":
      case "plainTime":
      case "duration":
        return `${scalarName ?? primitive}.fromISO(${quote(value)})`;
      case "bytes":
        return invalid();
      default:
        return quote(value);
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (type && type !== "number" && type !== "integer") return invalid();
    if (type === "integer" && !Number.isInteger(value)) return invalid();
    if (
      (schema.minimum !== undefined && value < schema.minimum) ||
      (schema.maximum !== undefined && value > schema.maximum)
    )
      return invalid();
    const primitive = getTypeSpecPrimitiveFromSchema({
      ...schema,
      type: type === "number" || type === "integer" ? type : undefined,
    });
    if (primitive === "duration" || primitive === "utcDateTime") return invalid();
    if (primitive === "float32" && Math.abs(value) > 3.4e38) return invalid();
    if (primitive === "safeint" && !Number.isSafeInteger(value)) return invalid();
    const integer = /^(u?)int(8|16|32|64)$/.exec(primitive ?? "");
    if (integer) {
      const bits = BigInt(integer[2]);
      const min = integer[1] ? 0n : -(1n << (bits - 1n));
      const max = integer[1] ? (1n << bits) - 1n : (1n << (bits - 1n)) - 1n;
      const exact = Numeric(JSON.stringify(value)).asBigInt();
      if (exact === null || exact < min || exact > max) return invalid();
    }
    return JSON.stringify(value);
  }
  if (typeof value === "boolean" && (!type || type === "boolean")) return String(value);
  return invalid();
}
