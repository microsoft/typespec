import "../dist/src/index.js";

namespace JsonSchema;

/**
 * Add to namespaces to emit models within that namespace to JSON schema.
 * Add to another declaration to emit that declaration to JSON schema.
 *
 * Optionally, for namespaces, you can provide a baseUri, and for other declarations,
 * you can provide the id.
 *
 * @param baseUri Schema IDs are interpreted as relative to this URI.
 */
extern dec jsonSchema(target: unknown, baseUri?: string);

/**
 * Set the base URI for any schemas emitted from types within this namespace.
 *
 * @param baseUri the base URI. Schema IDs inside this namespace are relative to this URI.
 */
extern dec baseUri(target: Reflection.Namespace, baseUri: string);

/**
 * Specify the JSON Schema id. If this model or a parent namespace has a base URI,
 * the provided ID will be relative to that base URI.
 *
 * By default, the id will be constructed based on the declaration's name.
 *
 * @param id the id of the JSON schema for this declaration.
 */
extern dec id(target: unknown, id: string);

/**
 * Specify that the numeric type must be a multiple of some numeric value.
 *
 * @param value The numeric type must be a multiple of this value.
 */
extern dec multipleOf(target: numeric | Reflection.ModelProperty, value: numeric);

/**
 * Specify that the array must contain at least one instance of the provided type.
 * Use `@minContains` and `@maxContains` to customize how many instances to expect.
 *
 * @param value The type the array must contain.
 */
extern dec contains(target: unknown[] | Reflection.ModelProperty, value: unknown);

/**
 * Specify that the array must contain at least some number of the types provided
 * by the contains decorator.
 *
 * @param value The minimum number of instances the array must contain
 */
extern dec minContains(target: unknown[] | Reflection.ModelProperty, value: valueof int32);

/**
 * Specify that the array must contain at most some number of the types provided
 * by the contains decorator.
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
 * @param value a tuple containing the types that must be present at the start of the array
 */
extern dec prefixItems(target: unknown[] | Reflection.ModelProperty, value: unknown[]);

/**
 * Specify the content type of content stored in a string.
 *
 * @param the media type of the string contents
 *
 */
extern dec contentMediaType(target: string | Reflection.ModelProperty, value: valueof string);

/**
 * Specify the schema for the contents of a string when interpreted according to the content's
 * media type and encoding.
 *
 * @param value the schema of the string contents
 */
extern dec contentSchema(target: string | Reflection.ModelProperty, value: unknown);

enum Format {
  dateTime: "date-time",
  date: "date",
  time: "time",
  duration: "duration",
  email: "email",
  idnEmail: "idn-email",
  hostname: "hostname",
  idnHostname: "idn-hostname",
  ipv4: "ipv4",
  ipv6: "ipv6",
  uri: "uri",
  uriReference: "uri-reference",
  iri: "iri",
  iriReference: "iri-reference",
  uuid: "uuid",
  jsonPointer: "json-pointer",
  relativeJsonPointer: "relative-json-pointer",
  regex: "regex",
}
