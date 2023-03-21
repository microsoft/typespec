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
extern dec JsonSchema(target: unknown, baseUri?: string);

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
