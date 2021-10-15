// Static assert: this won't compile if one of the entries above is invalid.

import { createDiagnosticCreator } from "./diagnostics.js";
import { paramMessage } from "./library.js";
import { TypeOfDiagnostics } from "./types.js";

const diagnostics = {
  /**
   * Scanner errors.
   */
  "digit-expected": {
    severity: "error",
    messages: {
      default: "Digit expected.",
    },
  },

  "hex-digit-expected": {
    severity: "error",
    messages: {
      default: "Hexadecimal digit expected.",
    },
  },

  "binary-digit-expected": {
    severity: "error",
    messages: {
      default: "Binary digit expected.",
    },
  },

  unterminated: {
    severity: "error",
    messages: {
      default: paramMessage`Unterminated ${"token"}.`,
    },
  },
  "creating-file": {
    severity: "error",
    messages: {
      default: paramMessage`Error creating single file: ${"filename"},  ${"error"}`,
    },
  },

  "invalid-escape-sequence": {
    severity: "error",
    messages: {
      default: "Invalid escape sequence.",
    },
  },

  "no-new-line-start-triple-quote": {
    severity: "error",
    messages: {
      default: "String content in triple quotes must begin on a new line.",
    },
  },

  "no-new-line-end-triple-quote": {
    severity: "error",
    messages: {
      default: "Closing triple quotes must begin on a new line.",
    },
  },

  "triple-quote-indent": {
    severity: "error",
    messages: {
      default:
        "All lines in triple-quoted string lines must have the same indentation as closing triple quotes.",
    },
  },

  "invalid-character": {
    severity: "error",
    messages: {
      default: "Invalid character.",
    },
  },

  /**
   * Utils
   */
  "file-not-found": {
    severity: "error",
    messages: {
      default: paramMessage`File ${"path"} not found.`,
    },
  },
  "file-load": {
    severity: "error",
    messages: {
      default: paramMessage`${"message"}`,
    },
  },

  /**
   * Parser errors.
   */
  "multiple-blockless-namespace": {
    severity: "error",
    messages: {
      default: "Cannot use multiple blockless namespaces.",
    },
  },
  "blockless-namespace-first": {
    severity: "error",
    messages: {
      default: "Blockless namespaces can't follow other declarations.",
      topLevel: "Blockless namespace can only be top-level.",
    },
  },
  "import-first": {
    severity: "error",
    messages: {
      default: "Imports must come prior to namespaces or other declarations.",
      topLevel: "Imports must be top-level and come prior to namespaces or other declarations.",
    },
  },
  "default-optional": {
    severity: "error",
    messages: {
      default: "Cannot use default with non optional properties",
    },
  },
  "token-expected": {
    severity: "error",
    messages: {
      default: paramMessage`${"token"} expected.`,
      unexpected: paramMessage`Unexpected token ${"token"}`,
      numericOrStringLiteral: "Expected numeric or string literal",
      identifer: "Identifier expected.",
      expression: "Expression expected.",
      statement: "Statement expected.",
      property: "Property expected.",
      enumMember: "Enum member expected.",
    },
  },
  "trailing-token": {
    severity: "error",
    messages: {
      default: paramMessage`Trailing ${"token"}`,
    },
  },
  "unknown-directive": {
    severity: "error",
    messages: {
      default: paramMessage`Unknown directive '#${"id"}'`,
    },
  },
  "reserverd-identifier": {
    severity: "error",
    messages: {
      default: "Keyword cannot be used as identifier.",
    },
  },
  "invalid-directive-location": {
    severity: "error",
    messages: {
      default: paramMessage`Cannot place directive on ${"nodeName"}.`,
    },
  },
  "invalid-decorator-location": {
    severity: "error",
    messages: {
      default: paramMessage`Cannot decorate ${"nodeName"}.`,
    },
  },

  /**
   * Checker
   */
  "using-invalid-ref": {
    severity: "error",
    messages: {
      default: "Using must refer to a namespace",
      decorator: "Can't use a decorator",
    },
  },
  "invalid-type-ref": {
    severity: "error",
    messages: {
      default: "Invalid type reference",
      decorator: "Can't put a decorator in a type",
    },
  },
  "invalid-template-args": {
    severity: "error",
    messages: {
      default: "Invalid template arguments.",
      notTemplate: "Can't pass template arguments to non-templated type",
      tooFew: "Too few template arguments provided.",
      tooMany: "Too many template arguments provided.",
    },
  },
  "intersect-non-model": {
    severity: "error",
    messages: {
      default: "Cannot intersect non-model types (including union types).",
    },
  },
  "intersect-duplicate-property": {
    severity: "error",
    messages: {
      default: paramMessage`Intersection contains duplicate property definitions for ${"propName"}`,
    },
  },
  "unknown-identifier": {
    severity: "error",
    messages: {
      default: paramMessage`Unknown identifier ${"id"}`,
    },
  },
  "unknown-decorator": {
    severity: "error",
    messages: {
      default: "Unknown decorator",
    },
  },
  "invalid-decorator": {
    severity: "error",
    messages: {
      default: paramMessage`${"id"} is not a decorator`,
    },
  },
  "invalid-ref": {
    severity: "error",
    messages: {
      default: paramMessage`Cannot resolve ${"id"}`,
      inDecorator: paramMessage`Cannot resolve ${"id"} in decorator`,
      underNamespace: paramMessage`Namespace doesn't have member ${"id"}`,
      node: paramMessage`Cannot resolve '${"id"}' in non-namespace node ${"nodeName"}`,
    },
  },
  "duplicate-property": {
    severity: "error",
    messages: {
      default: paramMessage`Model already has a property named ${"propName"}`,
    },
  },
  "override-property": {
    severity: "error",
    messages: {
      default: paramMessage`Model has an inherited property named ${"propName"} which cannot be overridden`,
    },
  },
  "extend-model": {
    severity: "error",
    messages: {
      default: "Models must extend other models.",
    },
  },
  "is-model": {
    severity: "error",
    messages: {
      default: "Model `is` must specify another model.",
    },
  },
  "spread-model": {
    severity: "error",
    messages: {
      default: "Cannot spread properties of non-model type.",
    },
  },
  "unsupported-default": {
    severity: "error",
    messages: {
      default: paramMessage`Default values are not supported for '${"type"}' type`,
    },
  },
  "invalid-default-type": {
    severity: "error",
    messages: {
      default: paramMessage`Default must be a ${"type"}`,
    },
  },
  "mixes-interface": {
    severity: "error",
    messages: {
      default: "Interfaces can only mix other interfaces",
    },
  },
  "mixes-interface-duplicate": {
    severity: "error",
    messages: {
      default: paramMessage`Interface mixes cannot have duplicate members. The duplicate member is named ${"name"}`,
    },
  },
  "interface-duplicate": {
    severity: "error",
    messages: {
      default: paramMessage`Interface already has a member named ${"name"}`,
    },
  },
  "union-duplicate": {
    severity: "error",
    messages: {
      default: paramMessage`Union already has a variant named ${"name"}`,
    },
  },
  "enum-member-duplicate": {
    severity: "error",
    messages: {
      default: paramMessage`Enum already has a member named ${"name"}`,
    },
  },
  "decorator-fail": {
    severity: "error",
    messages: {
      default: paramMessage`${"decoratorName"} failed with errors. ${"error"}`,
    },
  },

  /**
   * Program
   */
  "dynamic-import": {
    severity: "error",
    messages: {
      default: "Dynamically generated Cadl cannot have imports",
    },
  },
  "invalid-import": {
    severity: "error",
    messages: {
      default: "Import paths must reference either a directory, a .cadl file, or .js file",
    },
  },
  "library-not-found": {
    severity: "error",
    messages: {
      default: paramMessage`Couldn't find library "${"path"}"`,
    },
  },
  "compiler-version-mismatch": {
    severity: "error",
    messages: {
      default: paramMessage`Current Cadl compiler conflicts with local version of @cadl-lang/compiler referenced in ${"basedir"}. \nIf this error occurs on the command line, try running \`cadl\` with a working directory of ${"basedir"}. \nIf this error occurs in the IDE, try configuring the \`cadl-server\` path to ${"betterCadlServerPath"}.`,
    },
  },
  "duplicate-symbol": {
    severity: "error",
    messages: {
      default: paramMessage`Duplicate name: "${"name"}"`,
    },
  },

  /**
   * Binder
   */
  "on-build-fail": {
    severity: "error",
    messages: {
      default: paramMessage`onBuild failed with errors. ${"error"}`,
    },
  },

  /**
   * Decorator
   */
  "decorator-wrong-target": {
    severity: "error",
    messages: {
      default: paramMessage`Cannot apply ${"decorator"} decorator to ${"to"}`,
      model: paramMessage`The ${"decorator"} decorator can only be applied to models.`,
      namespacesOrOperations: paramMessage`The ${"decorator"} decorator can only be applied to namespaces or operations.`,
      operationsOrModelProps: paramMessage`The ${"decorator"} decorator  can only be applied to operations or model properties.`,
    },
  },

  /**
   * Mutator
   */
  "add-response": {
    severity: "error",
    messages: {
      default: "Cannot add a response to anything except an operation statement.",
    },
  },
  "add-parameter": {
    severity: "error",
    messages: {
      default: "Cannot add a parameter to anything except an operation statement.",
    },
  },
  "add-model-property": {
    severity: "error",
    messages: {
      default: "Cannot add a model property to anything except a model statement.",
    },
  },
  "add-model-property-fail": {
    severity: "error",
    messages: {
      default: paramMessage`Could not add property/parameter "${"propertyName"}" of type "${"propertyTypeName"}"`,
    },
  },
  "add-response-type": {
    severity: "error",
    messages: {
      default: paramMessage`Could not add response type "${"responseTypeName"}" to operation ${"operationName"}"`,
    },
  },
} as const;

export type CompilerDiagnostics = TypeOfDiagnostics<typeof diagnostics>;
export const { createDiagnostic, reportDiagnostic } = createDiagnosticCreator(diagnostics);
