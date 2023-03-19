import "../dist/src/index.js";

namespace JsonSchema;

extern dec JsonSchema(target: Reflection.Namespace | object);
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
