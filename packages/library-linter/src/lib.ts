import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const libDef = {
  name: "@typespec/library-linter",
  diagnostics: {
    "missing-namespace": {
      severity: "warning",
      messages: {
        default: paramMessage`${"type"} '${"name"}' is not in a namespace. This is bad practice for a published library.`,
      },
    },
    "missing-signature": {
      severity: "warning",
      messages: {
        default: paramMessage`Decorator function $${"decName"} is missing a decorator declaration. Add "extern dec ${"decName"}(...args);" to the library tsp.`,
      },
    },
    "missing-documentation": {
      severity: "warning",
      messages: {
        default: paramMessage`Missing documentation for ${"kind"} '${"name"}'. Add a doc comment describing it.`,
        member: paramMessage`Missing documentation for ${"kind"} '${"name"}' of '${"container"}'. Add a doc comment describing it.`,
      },
    },
    "extraneous-documentation": {
      severity: "warning",
      messages: {
        param: paramMessage`Documented parameter '${"name"}' does not exist on ${"kind"} '${"container"}'.`,
        prop: paramMessage`Documented property '${"name"}' does not exist on ${"kind"} '${"container"}'.`,
        templateParam: paramMessage`Documented template parameter '${"name"}' does not exist on ${"kind"} '${"container"}'.`,
        tagNotApplicable: paramMessage`Doc tag '@${"tagName"}' is not applicable to ${"kind"} '${"container"}'.`,
        unknownTag: paramMessage`Unknown doc tag '@${"tagName"}'. Use backticks around code if this was not meant to be a tag.`,
      },
    },
  },
} as const;
const lib = createTypeSpecLibrary(libDef);
export const { reportDiagnostic } = lib;

export type OpenAPILibrary = typeof lib;
