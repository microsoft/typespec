import "../dist/src/tsp-index.js";

namespace TypeSpec.JsonSchema;

/**
 * Add to namespaces to emit models within that namespace to JSON schema.
 * Add to another declaration to emit that declaration to JSON schema.
 *
 * Optionally, for namespaces, you can provide a baseUri, and for other declarations,
 * you can provide the id.
 *
 * @param baseUri Schema IDs are interpreted as relative to this URI.
 */
extern dec jsonSchema(target: unknown, baseUri?: valueof string);

/**
 * Set the base URI for any schemas emitted from types within this namespace.
 *
 * @param baseUri The base URI. Schema IDs inside this namespace are relative to this URI.
 */
extern dec baseUri(target: Reflection.Namespace, baseUri: valueof string);

/**
 * Specify the JSON Schema id. If this model or a parent namespace has a base URI,
 * the provided ID will be relative to that base URI.
 *
 * By default, the id will be constructed based on the declaration's name.
 *
 * @param id The id of the JSON schema for this declaration.
 */
extern dec id(target: unknown, id: valueof string);

/**
 * Specify that `oneOf` should be used instead of `anyOf` for that union.
 */
extern dec oneOf(target: Reflection.Union | Reflection.ModelProperty);

/**
 * Specify that the numeric type must be a multiple of some numeric value.
 *
 * @param value The numeric type must be a multiple of this value.
 */
extern dec multipleOf(target: numeric | Reflection.ModelProperty, value: valueof numeric);

/**
 * Specify that the array must contain at least one instance of the provided type.
 * Use `@minContains` and `@maxContains` to customize how many instances to expect.
 *
 * @param value The type the array must contain.
 */
extern dec contains(target: unknown[] | Reflection.ModelProperty, value: unknown);

/**
 * Used in conjunction with the `@contains` decorator,
 * specifies that the array must contain at least a certain number of the types provided by the `@contains` decorator.
 *
 * @param value The minimum number of instances the array must contain
 */
extern dec minContains(target: unknown[] | Reflection.ModelProperty, value: valueof int32);

/**
 * Used in conjunction with the `@contains` decorator,
 * specifies that the array must contain at most a certain number of the types provided by the `@contains` decorator.
 *
 * @param value The maximum number of instances the array must contain
 */
extern dec maxContains(target: unknown[] | Reflection.ModelProperty, value: valueof int32);

/**
 * Specify that every item in the array must be unique.
 */
extern dec uniqueItems(target: unknown[] | Reflection.ModelProperty);

/**
 * Specify the minimum number of properties this object can have.
 *
 * @param value The minimum number of properties this object can have.
 */
extern dec minProperties(target: Record<unknown> | Reflection.ModelProperty, value: valueof int32);

/**
 * Specify the maximum number of properties this object can have.
 *
 * @param value The maximum number of properties this object can have.
 */
extern dec maxProperties(target: Record<unknown> | Reflection.ModelProperty, value: valueof int32);

/**
 * Specify the encoding used for the contents of a string.
 * @param value
 */
extern dec contentEncoding(target: string | Reflection.ModelProperty, value: valueof string);

/**
 * Specify that the target array must begin with the provided types.
 *
 * @param value A tuple containing the types that must be present at the start of the array
 */
extern dec prefixItems(target: unknown[] | Reflection.ModelProperty, value: unknown[]);

/**
 * Specify the content type of content stored in a string.
 *
 * @param value The media type of the string contents
 *
 */
extern dec contentMediaType(target: string | Reflection.ModelProperty, value: valueof string);

/**
 * Specify the schema for the contents of a string when interpreted according to the content's
 * media type and encoding.
 *
 * @param value The schema of the string contents
 */
extern dec contentSchema(target: string | Reflection.ModelProperty, value: unknown);

/**
 * Specify a custom property to add to the emitted schema. This is useful for adding custom keywords
 * and other vendor-specific extensions. Scalar values need to be specified using `typeof` to be converted to a schema.
 * 
 * For example, `@extension("x-schema", typeof "foo")` will emit a JSON schema value for `x-schema`,
 * whereas `@extension("x-schema", "foo")` will emit the raw code `"foo"`.
 *
 * The value will be treated as a raw value if any of the following are true:
 * - The value is a scalar value (e.g. string, number, boolean, etc.)
 * - The value is wrapped in the `Json<Data>` template
 * - The value is provided using the value syntax (e.g. `#{}`, `#[]`)
 
 * For example, `@extension("x-schema", { x: "value" })` will emit a JSON schema value for `x-schema`,
 * whereas `@extension("x-schema", #{x: "value"})` and `@extension("x-schema", Json<{x: "value"}>)`
 * will emit the raw JSON code `{x: "value"}`.
 *
 * @param key The name of the keyword of vendor extension, e.g. `x-custom`.
 * @param value The value of the keyword.
 */
extern dec extension(target: unknown, key: valueof string, value: (valueof unknown) | unknown);

/**
 * Well-known JSON Schema formats.
 */
enum Format {
  /** A date and time, as defined by the `date-time` production in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6). */
  dateTime: "date-time",

  /** A calendar date, as defined by the `full-date` production in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6). */
  date: "date",

  /** A time of day, as defined by the `full-time` production in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6). */
  time: "time",

  /** An ISO 8601 duration such as `P3DT4H5M`, as defined by the `duration` production in [RFC 3339, appendix A](https://datatracker.ietf.org/doc/html/rfc3339#appendix-A). */
  duration: "duration",

  /** An email address, as defined by the `addr-spec` production in [RFC 5322](https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1). */
  email: "email",

  /** An internationalized email address, as defined by [RFC 6531](https://datatracker.ietf.org/doc/html/rfc6531). */
  idnEmail: "idn-email",

  /** A host name, as defined by [RFC 1123](https://datatracker.ietf.org/doc/html/rfc1123#section-2.1). */
  hostname: "hostname",

  /** An internationalized host name, as defined by [RFC 5890](https://datatracker.ietf.org/doc/html/rfc5890#section-2.3.2.3). */
  idnHostname: "idn-hostname",

  /** An IPv4 address, as defined by the `dotted-quad` production in [RFC 2673](https://datatracker.ietf.org/doc/html/rfc2673#section-3.2). */
  ipv4: "ipv4",

  /** An IPv6 address, as defined by [RFC 4291](https://datatracker.ietf.org/doc/html/rfc4291#section-2.2). */
  ipv6: "ipv6",

  /** A URI, as defined by [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986). */
  uri: "uri",

  /** A URI reference, which may be relative, as defined by [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#section-4.1). */
  uriReference: "uri-reference",

  /** An internationalized resource identifier, as defined by [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987). */
  iri: "iri",

  /** An internationalized resource identifier reference, which may be relative, as defined by [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987). */
  iriReference: "iri-reference",

  /** A universally unique identifier, as defined by [RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122). */
  uuid: "uuid",

  /** A JSON pointer, as defined by [RFC 6901](https://datatracker.ietf.org/doc/html/rfc6901). */
  jsonPointer: "json-pointer",

  /** A relative JSON pointer, as defined by the [relative JSON pointer draft](https://datatracker.ietf.org/doc/html/draft-handrews-relative-json-pointer-01). */
  relativeJsonPointer: "relative-json-pointer",

  /** A regular expression, as defined by [ECMA-262](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/). */
  regex: "regex",
}

/**
 * Specify that the provided template argument should be emitted as raw JSON or YAML
 * as opposed to a schema. Use in combination with the `@extension` decorator. For example,
 * `@extension("x-schema", { x: "value" })` will emit a JSON schema value for `x-schema`,
 * whereas `@extension("x-schema", Json<{x: "value"}>)` will emit the raw JSON code
 * `{x: "value"}`.
 *
 * @template Data the type to convert to raw JSON
 */
@Private.validatesRawJson(Data)
model Json<Data> {
  /** The value to emit as raw JSON or YAML. */
  value: Data;
}

namespace Private {
  extern dec validatesRawJson(target: Reflection.Model, value: unknown);
}
