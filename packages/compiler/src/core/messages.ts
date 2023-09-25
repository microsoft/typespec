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
   * Init templates
   */
  "init-template-invalid-json": {
    severity: "error",
    messages: {
      default: paramMessage`Unable to parse ${"url"}: ${"message"}. Check that the template URL is correct.`,
    },
  },
  "init-template-download-failed": {
    severity: "error",
    messages: {
      default: paramMessage`Failed to download template from ${"url"}: ${"message"}. Check that the template URL is correct.`,
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
  "token-expected": {
    severity: "error",
    messages: {
      default: paramMessage`${"token"} expected.`,
      unexpected: paramMessage`Unexpected token ${"token"}`,
      numericOrStringLiteral: "Expected numeric or string literal.",
      identifier: "Identifier expected.",
      projectionDirection: "from or to expected.",
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
  "augment-decorator-target": {
    severity: "error",
    messages: {
      default: `Augment decorator first argument must be a type reference.`,
      noInstance: `Cannot reference template instances`,
    },
  },
  "duplicate-decorator": {
    severity: "warning",
    messages: {
      default: paramMessage`Decorator ${"decoratorName"} cannot be used twice on the same declaration.`,
    },
  },
  "decorator-conflict": {
    severity: "warning",
    messages: {
      default: paramMessage`Decorator ${"decoratorName"} cannot be used with decorator ${"otherDecoratorName"} on the same declaration.`,
    },
  },
  "reserved-identifier": {
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
  "invalid-projection": {
    severity: "error",
    messages: {
      default: "Invalid projection",
      wrongType: "Non-projection can't be used to project",
      noTo: "Projection missing to projection",
      projectionError: paramMessage`An error occurred when projecting this type: ${"message"}`,
    },
  },
  "default-required": {
    severity: "error",
    messages: {
      default: "Required template parameters must not follow optional template parameters",
    },
  },
  "invalid-template-default": {
    severity: "error",
    messages: {
      default:
        "Template parameter defaults can only reference previously declared type parameters.",
    },
  },
  "required-parameter-first": {
    severity: "error",
    messages: {
      default: "A required parameter cannot follow an optional parameter.",
    },
  },
  "rest-parameter-last": {
    severity: "error",
    messages: {
      default: "A rest parameter must be last in a parameter list.",
    },
  },
  "rest-parameter-required": {
    severity: "error",
    messages: {
      default: "A rest parameter cannot be optional.",
    },
  },
  /**
   * Parser doc comment warnings.
   * Design goal: Malformed doc comments should only produce warnings, not errors.
   */
  "doc-invalid-identifier": {
    severity: "warning",
    messages: {
      default: "Invalid identifier.",
      tag: "Invalid tag name. Use backticks around code if this was not meant to be a tag.",
      param: "Invalid parameter name.",
      templateParam: "Invalid template parameter name.",
    },
  },
  /**
   * Checker
   */
  "using-invalid-ref": {
    severity: "error",
    messages: {
      default: "Using must refer to a namespace",
    },
  },
  "invalid-type-ref": {
    severity: "error",
    messages: {
      default: "Invalid type reference",
      decorator: "Can't put a decorator in a type",
      function: "Can't use a function as a type",
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
  "intersect-invalid-index": {
    severity: "error",
    messages: {
      default: "Cannot intersect incompatible models.",
      never: "Cannot intersect a model that cannot hold properties.",
      array: "Cannot intersect an array model.",
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
      underNamespace: paramMessage`Namespace ${"namespace"} doesn't have member ${"id"}`,
      underContainer: paramMessage`${"kind"} doesn't have member ${"id"}`,
      metaProperty: paramMessage`${"kind"} doesn't have meta property ${"id"}`,
      node: paramMessage`Cannot resolve '${"id"}' in node ${"nodeName"} since it has no members. Did you mean to use "::" instead of "."?`,
    },
  },
  "duplicate-property": {
    severity: "error",
    messages: {
      default: paramMessage`Model already has a property named ${"propName"}`,
    },
  },
  "override-property-mismatch": {
    severity: "error",
    messages: {
      default: paramMessage`Model has an inherited property named ${"propName"} of type ${"propType"} which cannot override type ${"parentType"}`,
    },
  },
  "extend-scalar": {
    severity: "error",
    messages: {
      default: "Scalar must extend other scalars.",
    },
  },
  "extend-model": {
    severity: "error",
    messages: {
      default: "Models must extend other models.",
      modelExpression: "Models cannot extend model expressions.",
    },
  },
  "is-model": {
    severity: "error",
    messages: {
      default: "Model `is` must specify another model.",
      modelExpression: "Model `is` cannot specify a model expression.",
    },
  },
  "is-operation": {
    severity: "error",
    messages: {
      default: "Operation can only reuse the signature of another operation.",
    },
  },
  "spread-model": {
    severity: "error",
    messages: {
      default: "Cannot spread properties of non-model type.",
      neverIndex: "Cannot spread type because it cannot hold properties.",
    },
  },
  "unsupported-default": {
    severity: "error",
    messages: {
      default: paramMessage`Default must be have a value type but has type '${"type"}'.`,
    },
  },
  unassignable: {
    severity: "error",
    messages: {
      default: paramMessage`Type '${"value"}' is not assignable to type '${"targetType"}'`,
      withDetails: paramMessage`Type '${"sourceType"}' is not assignable to type '${"targetType"}'\n  ${"details"}`,
    },
  },
  "no-prop": {
    severity: "error",
    messages: {
      default: paramMessage`Property '${"propName"}' cannot be defined because model cannot hold properties.`,
    },
  },
  "missing-index": {
    severity: "error",
    messages: {
      default: paramMessage`Index signature for type '${"indexType"}' is missing in type '${"sourceType"}'.`,
    },
  },
  "missing-property": {
    severity: "error",
    messages: {
      default: paramMessage`Property '${"propertyName"}' is missing on type '${"sourceType"}' but required in '${"targetType"}'`,
    },
  },
  "extends-interface": {
    severity: "error",
    messages: {
      default: "Interfaces can only extend other interfaces",
    },
  },
  "extends-interface-duplicate": {
    severity: "error",
    messages: {
      default: paramMessage`Interface extends cannot have duplicate members. The duplicate member is named ${"name"}`,
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
  "spread-enum": {
    severity: "error",
    messages: {
      default: "Cannot spread members of non-enum type.",
    },
  },
  "decorator-fail": {
    severity: "error",
    messages: {
      default: paramMessage`Decorator ${"decoratorName"} failed!\n\n${"error"}`,
    },
  },
  "rest-parameter-array": {
    severity: "error",
    messages: {
      default: "A rest parameter must be of an array type.",
    },
  },
  "decorator-extern": {
    severity: "error",
    messages: {
      default: "A decorator declaration must be prefixed with the 'extern' modifier.",
    },
  },
  "function-extern": {
    severity: "error",
    messages: {
      default: "A function declaration must be prefixed with the 'extern' modifier.",
    },
  },
  "missing-implementation": {
    severity: "error",
    messages: {
      default: "Extern declaration must have an implementation in JS file.",
    },
  },
  "overload-same-parent": {
    severity: "error",
    messages: {
      default: `Overload must be in the same interface or namespace.`,
    },
  },
  shadow: {
    severity: "warning",
    messages: {
      default: paramMessage`Shadowing parent template parmaeter with the same name "${"name"}"`,
    },
  },
  "invalid-deprecation-argument": {
    severity: "error",
    messages: {
      default: paramMessage`#deprecation directive is expecting a string literal as the message but got a "${"kind"}"`,
      missing: "#deprecation directive is expecting a message argument but none was provided.",
    },
  },
  "duplicate-deprecation": {
    severity: "warning",
    messages: {
      default: "The #deprecated directive cannot be used more than once on the same declaration.",
    },
  },

  /**
   * Configuration
   */
  "config-invalid-argument": {
    severity: "error",
    messages: {
      default: paramMessage`Argument "${"name"}" is not defined as a parameter in the config.`,
    },
  },
  "config-circular-variable": {
    severity: "error",
    messages: {
      default: paramMessage`There is a circular reference to variable "${"name"}" in the cli configuration or arguments.`,
    },
  },
  "config-path-absolute": {
    severity: "error",
    messages: {
      default: paramMessage`Path "${"path"}" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
    },
  },
  "config-path-not-found": {
    severity: "error",
    messages: {
      default: paramMessage`No configuration file found at config path "${"path"}".`,
    },
  },
  /**
   * Program
   */
  "dynamic-import": {
    severity: "error",
    messages: {
      default: "Dynamically generated TypeSpec cannot have imports",
    },
  },
  "invalid-import": {
    severity: "error",
    messages: {
      default: "Import paths must reference either a directory, a .tsp file, or .js file",
    },
  },
  "invalid-main": {
    severity: "error",
    messages: {
      default: "Main file must either be a .tsp file or a .js file.",
    },
  },
  "import-not-found": {
    severity: "error",
    messages: {
      default: paramMessage`Couldn't resolve import "${"path"}"`,
    },
  },
  "library-invalid": {
    severity: "error",
    messages: {
      tspMain: paramMessage`Library "${"path"}" has an invalid tspMain file.`,
      default: paramMessage`Library "${"path"}" has an invalid main file.`,
    },
  },
  "incompatible-library": {
    severity: "warning",
    messages: {
      default: paramMessage`Multiple versions of "${"name"}" library were loaded:\n${"versionMap"}`,
    },
  },
  "compiler-version-mismatch": {
    severity: "warning",
    messages: {
      default: paramMessage`Current TypeSpec compiler conflicts with local version of @typespec/compiler referenced in ${"basedir"}. \nIf this warning occurs on the command line, try running \`typespec\` with a working directory of ${"basedir"}. \nIf this warning occurs in the IDE, try configuring the \`tsp-server\` path to ${"betterTypeSpecServerPath"}.\n  Expected: ${"expected"}\n  Resolved: ${"actual"}`,
    },
  },
  "duplicate-symbol": {
    severity: "error",
    messages: {
      default: paramMessage`Duplicate name: "${"name"}"`,
    },
  },
  "decorator-decl-target": {
    severity: "error",
    messages: {
      default: "dec must have at least one parameter.",
      required: "dec first parameter must be required.",
    },
  },
  "projections-are-experimental": {
    severity: "warning",
    messages: {
      default:
        "Projections are experimental - your code will need to change as this feature evolves.",
    },
  },

  /**
   * Binder
   */
  "ambiguous-symbol": {
    severity: "error",
    messages: {
      default: paramMessage`"${"name"}" is an ambiguous name between ${"duplicateNames"}. Try using fully qualified name instead: ${"duplicateNames"}`,
    },
  },
  "duplicate-using": {
    severity: "error",
    messages: {
      default: paramMessage`duplicate using of "${"usingName"}" namespace`,
    },
  },

  /**
   * Library
   */
  "on-validate-fail": {
    severity: "error",
    messages: {
      default: paramMessage`onValidate failed with errors. ${"error"}`,
    },
  },
  "invalid-emitter": {
    severity: "error",
    messages: {
      default: paramMessage`Requested emitter package ${"emitterPackage"} does not provide an "onEmit" function.`,
    },
  },
  "missing-import": {
    severity: "error",
    messages: {
      default: paramMessage`Emitter '${"emitterName"}' requires '${"requiredImport"}' to be imported. Add 'import "${"requiredImport"}".`,
    },
  },

  /**
   * Linter
   */
  "invalid-rule-ref": {
    severity: "error",
    messages: {
      default: paramMessage`Reference "${"ref"}" is not a valid reference to a rule or ruleset. It must be in the following format: "<library-name>:<rule-name>"`,
    },
  },
  "unknown-rule": {
    severity: "error",
    messages: {
      default: paramMessage`Rule "${"ruleName"}" is not found in library "${"libraryName"}"`,
    },
  },
  "unknown-rule-set": {
    severity: "error",
    messages: {
      default: paramMessage`Rule set "${"ruleSetName"}" is not found in library "${"libraryName"}"`,
    },
  },
  "rule-enabled-disabled": {
    severity: "error",
    messages: {
      default: paramMessage`Rule "${"ruleName"}" has been enabled and disabled in the same ruleset.`,
    },
  },

  /**
   * Formatter
   */
  "format-failed": {
    severity: "error",
    messages: {
      default: paramMessage`File '${"file"}' failed to format. ${"details"}`,
    },
  },

  /**
   * Decorator
   */
  "decorator-wrong-target": {
    severity: "error",
    messages: {
      default: paramMessage`Cannot apply ${"decorator"} decorator to ${"to"}`,
      withExpected: paramMessage`Cannot apply ${"decorator"} decorator to ${"to"} since it is not assignable to ${"expected"}`,
    },
  },
  "invalid-argument": {
    severity: "error",
    messages: {
      default: paramMessage`Argument '${"value"}' is not assignable to parameter of type '${"expected"}'`,
    },
  },
  "invalid-argument-count": {
    severity: "error",
    messages: {
      default: paramMessage`Expected ${"expected"} arguments, but got ${"actual"}.`,
      atLeast: paramMessage`Expected at least ${"expected"} arguments, but got ${"actual"}.`,
    },
  },
  "known-values-invalid-enum": {
    severity: "error",
    messages: {
      default: paramMessage`Enum cannot be used on this type. Member ${"member"} is not assignable to type ${"type"}.`,
    },
  },
  "invalid-value": {
    severity: "error",
    messages: {
      default: paramMessage`Type '${"kind"}' is not a value type.`,
      atPath: paramMessage`Type '${"kind"}' of '${"path"}' is not a value type.`,
    },
  },
  deprecated: {
    severity: "warning",
    messages: {
      default: paramMessage`Deprecated: ${"message"}`,
    },
  },
  "no-optional-key": {
    severity: "error",
    messages: {
      default: paramMessage`Property '${"propertyName"}' marked as key cannot be optional.`,
    },
  },
  "invalid-discriminated-union": {
    severity: "error",
    messages: {
      default: "",
      noAnonVariants: "Unions with anonymous variants cannot be discriminated",
    },
  },
  "invalid-discriminated-union-variant": {
    severity: "error",
    messages: {
      default: paramMessage`Union variant "${"name"}" must be a model type.`,
      noDiscriminant: paramMessage`Variant "${"name"}" type is missing the discriminant property "${"discriminant"}".`,
      wrongDiscriminantType: paramMessage`Variant "${"name"}" type's discriminant property "${"discriminant"}" must be a string literal or string enum member.`,
    },
  },
  "missing-discriminator-property": {
    severity: "error",
    messages: {
      default: paramMessage`Each derived model of a discriminated model type should have set the discriminator property("${"discriminator"}") or have a derived model which has. Add \`${"discriminator"}: "<discriminator-value>"\``,
    },
  },
  "invalid-discriminator-value": {
    severity: "error",
    messages: {
      default: paramMessage`Discriminator value should be a string, union of string or string enum but was ${"kind"}.`,
      required: "The discriminator property must be a required property.",
      duplicate: paramMessage`Discriminator value "${"discriminator"}" is already used in another variant.`,
    },
  },

  "invalid-encode": {
    severity: "error",
    messages: {
      default: "Invalid encoding",
      wrongType: paramMessage`Encoding '${"encoding"}' cannot be used on type '${"type"}'. Expected: ${"expected"}.`,
      wrongEncodingType: paramMessage`Encoding '${"encoding"}' on type '${"type"}' is expected to be serialized as '${"expected"}' but got '${"actual"}'.`,
      wrongNumericEncodingType: paramMessage`Encoding '${"encoding"}' on type '${"type"}' is expected to be serialized as '${"expected"}' but got '${"actual"}'. Set '@encode' 2nd parameter to be of type ${"expected"}. e.g. '@encode("${"encoding"}", int32)'`,
    },
  },

  /**
   * Service
   */
  "service-decorator-duplicate": {
    severity: "error",
    messages: {
      default: `@service can only be set once per TypeSpec document.`,
    },
  },
  "list-type-not-model": {
    severity: "error",
    messages: {
      default: "@list decorator's parameter must be a model type.",
    },
  },
  "invalid-range": {
    severity: "error",
    messages: {
      default: paramMessage`Range "${"start"}..${"end"}" is invalid.`,
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
  "circular-base-type": {
    severity: "error",
    messages: {
      default: paramMessage`Type '${"typeName"}' recursively references itself as a base type.`,
    },
  },
  "circular-op-signature": {
    severity: "error",
    messages: {
      default: paramMessage`Operation '${"typeName"}' recursively references itself.`,
    },
  },
  "circular-alias-type": {
    severity: "error",
    messages: {
      default: paramMessage`Alias type '${"typeName"}' recursively references itself.`,
    },
  },
  "circular-prop": {
    severity: "error",
    messages: {
      default: paramMessage`Property '${"propName"}' recursively references itself.`,
    },
  },
  "conflict-marker": {
    severity: "error",
    messages: {
      default: "Conflict marker encountered.",
    },
  },

  // #region CLI
  "no-compatible-vs-installed": {
    severity: "error",
    messages: {
      default: "No compatible version of Visual Studio found.",
    },
  },
  "vs-extension-windows-only": {
    severity: "error",
    messages: {
      default: "Visual Studio extension is not supported on non-Windows.",
    },
  },
  "vscode-in-path": {
    severity: "error",
    messages: {
      default:
        "Couldn't find VS Code 'code' command in PATH. Make sure you have the VS Code executable added to the system PATH.",
      osx: "Couldn't find VS Code 'code' command in PATH. Make sure you have the VS Code executable added to the system PATH.\nSee instruction for Mac OS here https://code.visualstudio.com/docs/setup/mac",
    },
  },
  // #endregion CLI
} as const;

export type CompilerDiagnostics = TypeOfDiagnostics<typeof diagnostics>;
export const { createDiagnostic, reportDiagnostic } = createDiagnosticCreator(diagnostics);
