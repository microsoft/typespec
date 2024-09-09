import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

/** TypeSpec Xml Library Definition */
export const $lib = createTypeSpecLibrary({
  name: "@typespec/xml",
  diagnostics: {
    "ns-enum-not-declaration": {
      severity: "error",
      messages: {
        default:
          "Enum member used as namespace must be part of an enum marked with @nsDeclaration.",
      },
    },
    "invalid-ns-declaration-member": {
      severity: "error",
      messages: {
        default: paramMessage`Enum member ${"name"} must have a value that is the XML namespace url.`,
      },
    },
    "ns-missing-prefix": {
      severity: "error",
      messages: {
        default: "When using a string namespace you must provide a prefix as the 2nd argument.",
      },
    },
    "prefix-not-allowed": {
      severity: "error",
      messages: {
        default: "@ns decorator cannot have the prefix parameter set when using an enum member.",
      },
    },
    "ns-not-uri": {
      severity: "error",
      messages: {
        default: `Namespace ${"namespace"} is not a valid URI.`,
      },
    },
  },
  state: {
    attribute: { description: "Mark a model property to be serialized as xml attribute" },
    unwrapped: {
      description: "Mark a model property to be serialized without a node wrapping the content.",
    },
    ns: { description: "Namespace data" },
    nsDeclaration: { description: "Mark an enum that declares Xml Namespaces" },
  },
} as const);

export const { reportDiagnostic, createStateSymbol, stateKeys: XmlStateKeys } = $lib;
