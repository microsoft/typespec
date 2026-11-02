import type {
  Decorator,
  Enum,
  EnumMember,
  Interface,
  LinterRuleDefinition,
  LinterRuleSet,
  MixedFunctionParameter,
  Model,
  ModelProperty,
  Operation,
  PackageJson,
  Scalar,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";

/** Library-wide input consumed by the reference documentation renderers. */
export type TypeSpecRefDoc = TypeSpecLibraryRefDoc;

/** Extracted TypeSpec declarations and optional JavaScript library metadata for one package. */
export type TypeSpecLibraryRefDoc = TypeSpecRefDocBase & {
  /**
   * Library name
   */
  readonly name: string;

  /**
   * Library package.json
   */
  readonly packageJson: PackageJson;

  /**
   * Library description
   */
  readonly description?: string;

  /** Present when the JavaScript entry point exports `$lib.emitter.options`. */
  readonly emitter?: EmitterRefDoc;

  /** Documentation about the linter rules and ruleset provided in this library. */
  readonly linter?: LinterRefDoc;

  /** Documentation about the diagnostics that this library can report. */
  readonly diagnostics?: readonly DiagnosticRefDoc[];

  /** Documentation for sub-exports (e.g., "./streams", "./testing"). Keyed by export path. */
  readonly subExports?: ReadonlyMap<string, SubExportRefDoc>;
};

/** Declarations contributed by a TypeSpec sub-export, excluding sources loaded by the main export. */
export type SubExportRefDoc = TypeSpecRefDocBase & {
  /** The export path (e.g., "./streams") */
  readonly path: string;
};

/** Namespace-organized declarations and the compiler-type lookup used to build reference links. */
export type TypeSpecRefDocBase = {
  /** Nonempty namespaces, sorted by qualified ID; each declaration category is also sorted by ID. */
  readonly namespaces: readonly NamespaceRefDoc[];

  /**
   * Looks up an extracted top-level declaration by compiler object identity.
   * Returns undefined for uncollected types, including member records and namespaces.
   */
  readonly getNamedTypeRefDoc: (type: Type) => RefDocEntity | undefined;
};

/** Options extracted from the emitter's JSON Schema, rather than from TypeSpec declarations. */
export type EmitterRefDoc = {
  /** Options in schema property order; the compiler's common emitter options are not included. */
  readonly options: EmitterOptionRefDoc[];
};

/** Resolved linter definitions and any extended rule documentation supplied by the library. */
export type LinterRefDoc = {
  /** List of rulesets provided. */
  readonly ruleSets: LinterRuleSetRefDoc[];
  /** Rules in the order supplied by the resolved linter definition. */
  readonly rules: LinterRuleRefDoc[];
};

/** A named linter configuration that renderers can include in setup examples. */
export type LinterRuleSetRefDoc = ReferencableElement & {
  /** Discriminates rulesets from individual rules and TypeSpec declarations. */
  readonly kind: "ruleset";
  /** Original configuration, retaining its enabled and disabled rule settings. */
  readonly ruleSet: LinterRuleSet;
};
/** An individual rule with its executable definition and optional extended documentation. */
export type LinterRuleRefDoc = ReferencableElement & {
  /** Discriminates individual linter rules from other reference entities. */
  readonly kind: "rule";
  /** Original rule definition, including its short description and optional documentation URL. */
  readonly rule: LinterRuleDefinition<any, any>;
  /** Extended documentation as raw markdown, read from a co-located `.md` file. */
  readonly doc?: string;
};

/** A library diagnostic identified by its library-qualified code. */
export type DiagnosticRefDoc = ReferencableElement & {
  /** Severity declared by the library, independent of compiler warning promotion settings. */
  readonly severity: "warning" | "error";
  /** Extended documentation as raw markdown, read from a co-located `.md` file. */
  readonly doc?: string;
};

/** Display-oriented description of one JSON Schema property in an emitter's options. */
export type EmitterOptionRefDoc = {
  /** Property key used under the emitter's configuration entry. */
  readonly name: string;
  /** Human-readable schema type, not a compiler type or a schema to validate against. */
  readonly type: string;
  /** Schema description as Markdown, or an empty string when none is provided. */
  readonly doc: string;
  /** JSON-serialized schema default; absent when the schema declares no default. */
  readonly default?: string;
  /** Preformatted enum values, including quoted strings; arrays may describe allowed item values. */
  readonly allowedValues?: readonly string[];
  /** If set, the option is deprecated. Contains the deprecation message or empty string. */
  readonly deprecated?: string;
  /** Nested options for object-typed options. */
  readonly nestedOptions?: readonly EmitterOptionRefDoc[];
  /** When present, this option is a union of multiple variants (oneOf). */
  readonly variants?: readonly EmitterOptionVariantRefDoc[];
};

/** One alternative from an option's JSON Schema `oneOf`, kept separate for rendering. */
export type EmitterOptionVariantRefDoc = {
  /** Human-readable type of this alternative, including enum literals when applicable. */
  readonly type: string;
  /** Markdown description of this alternative, if supplied by the schema. */
  readonly doc?: string;
  /** JSON-serialized default for this alternative, if declared. */
  readonly default?: string;
  /** Preformatted enum literals accepted by this alternative, if constrained. */
  readonly allowedValues?: readonly string[];
  /** Nested options for object-typed variants. */
  readonly nestedOptions?: readonly EmitterOptionRefDoc[];
};

/** Entities that renderer link and file-selection hooks can distinguish by `kind`. */
export type RefDocEntity =
  | NamespaceRefDoc
  | DecoratorRefDoc
  | OperationRefDoc
  | InterfaceRefDoc
  | ModelRefDoc
  | EnumRefDoc
  | UnionRefDoc
  | ScalarRefDoc
  | LinterRuleSetRefDoc
  | LinterRuleRefDoc;

/** Direct declarations in one namespace; child namespaces have their own records. */
export type NamespaceRefDoc = {
  /** Discriminates namespace containers from declaration records. */
  readonly kind: "namespace";
  /** Fully qualified namespace name used as the grouping identity. */
  readonly id: string;
  /** Fully qualified display name, matching the namespace ID. */
  readonly name: string;
  /** Included decorators, sorted by qualified ID. */
  readonly decorators: readonly DecoratorRefDoc[];
  /** Included standalone operations; interface operations are stored on their interface. */
  readonly operations: readonly OperationRefDoc[];
  /** Included interfaces with their nested operation documentation. */
  readonly interfaces: readonly InterfaceRefDoc[];
  /** Included named model declarations, excluding anonymous models and template instances. */
  readonly models: readonly ModelRefDoc[];
  /** Included enum declarations, sorted by qualified ID. */
  readonly enums: readonly EnumRefDoc[];
  /** Included named union declarations, sorted by qualified ID. */
  readonly unions: readonly UnionRefDoc[];
  /** Included scalar declarations, sorted by qualified ID. */
  readonly scalars: readonly ScalarRefDoc[];
};

/** Identity and display label shared by entities used in renderer links. */
export type ReferencableElement = {
  /**
   * Link target identifier: qualified for top-level declarations and library rules,
   * but member records may use an unqualified name.
   */
  readonly id: string;

  /** Display label, which need not equal the qualified link identifier. */
  readonly name: string;
};

/** Common display content for a named declaration or one of its documented members. */
export type NamedTypeRefDoc = ReferencableElement & {
  /** TypeSpec declaration text for a code block, not the full original source. */
  readonly signature: string;
  /** Main Markdown description from source documentation or `@doc`; empty when undocumented. */
  readonly doc: string;
  /** Source `@example` entries in documentation order; empty when none are present. */
  readonly examples: readonly ExampleRefDoc[];
  /** Present when the compiler associates a deprecation message with the declaration. */
  readonly deprecated?: DeprecationNotice;
};

/** Compiler-provided deprecation text that a renderer can format as a warning. */
export type DeprecationNotice = {
  /** Explanation or migration guidance, without renderer-specific warning markup. */
  readonly message: string;
};

/** Decorator declaration with its target separated from ordinary invocation arguments. */
export type DecoratorRefDoc = NamedTypeRefDoc & {
  /** Selects decorator rendering and link routing. */
  readonly kind: "decorator";
  /** Original compiler declaration, retained for semantic type information. */
  readonly type: Decorator;
  /** Decorated entity parameter, not part of the ordinary parameters list. */
  readonly target: FunctionParameterRefDoc;
  /** Invocation arguments after the target, in declaration order. */
  readonly parameters: readonly FunctionParameterRefDoc[];
  /** Additional extracted tags; currently initialized to an empty array. */
  readonly otherTags: readonly string[];
};

/** A decorator target or argument together with its source parameter documentation. */
export type FunctionParameterRefDoc = {
  /** Compiler parameter, including its type/value constraint. */
  readonly type: MixedFunctionParameter;
  /** Parameter identifier used to match the source `@param` tag. */
  readonly name: string;
  /** Markdown from `@param`, or an empty string when the tag is missing. */
  readonly doc: string;
  /** Whether the caller may omit this argument. */
  readonly optional: boolean;
  /** Whether this parameter consumes the remaining invocation arguments. */
  readonly rest: boolean;
};

/** Source `@example` content, preserved as Markdown rather than evaluated TypeSpec. */
export type ExampleRefDoc = {
  /** Text on the same line as `@example`, if present; rendered as an example heading. */
  readonly title?: string;
  /** Remaining example body, including any source-supplied code fences. */
  readonly content: string;
};

/** Standalone or interface operation; interface operation display names include the interface. */
export type OperationRefDoc = NamedTypeRefDoc & {
  /** Selects operation rendering and link routing. */
  readonly kind: "operation";
  /** Original compiler operation, including its parameters and return type. */
  readonly type: Operation;
  /** Template declaration parameters in source order; absent for non-template operations. */
  readonly templateParameters?: TemplateParameterRefDoc[];
};

/** Interface declaration with documentation for each operation in compiler iteration order. */
export type InterfaceRefDoc = NamedTypeRefDoc & {
  /** Selects interface rendering and link routing. */
  readonly kind: "interface";
  /** Original compiler interface, retained for semantic inspection. */
  readonly type: Interface;
  /** Template declaration parameters in source order; absent for non-template interfaces. */
  readonly templateParameters?: readonly TemplateParameterRefDoc[];
  /** Operations rendered inside this interface, rather than as standalone namespace operations. */
  readonly interfaceOperations: readonly OperationRefDoc[];
};

/** Source documentation for one template declaration parameter. */
export type TemplateParameterRefDoc = {
  /** Parameter identifier used to match the `@template` tag. */
  readonly name: string;
  /** Markdown from `@template`, or an empty string when undocumented. */
  readonly doc: string;
};

/** Named model documentation with property records; indexer information remains on the compiler type. */
export type ModelRefDoc = NamedTypeRefDoc & {
  /** Selects model rendering and link routing. */
  readonly kind: "model";
  /** Original compiler model, including any base model and indexer. */
  readonly type: Model;

  /** Template declaration parameters in source order; absent for non-template models. */
  readonly templateParameters?: readonly TemplateParameterRefDoc[];
  /** Properties keyed by name, preserving the compiler model's property iteration order. */
  readonly properties: ReadonlyMap<string, ModelPropertyRefDoc>;
};

/** Property display content; optionality and the property's value type remain on `type`. */
export type ModelPropertyRefDoc = NamedTypeRefDoc & {
  /** Original compiler property, not the type of its value. */
  readonly type: ModelProperty;
};

/** Enum documentation with member records in compiler iteration order. */
export type EnumRefDoc = NamedTypeRefDoc & {
  /** Selects enum rendering and link routing. */
  readonly kind: "enum";
  /** Original compiler enum, retained alongside its display content. */
  readonly type: Enum;
  /** Member documentation keyed by the member name. */
  readonly members: ReadonlyMap<string, EnumMemberRefDoc>;
};

/** Enum member display content, with any explicit value available on the compiler member. */
export type EnumMemberRefDoc = NamedTypeRefDoc & {
  /** Original compiler member, including its optional string or numeric value. */
  readonly type: EnumMember;
};

/** Named union documentation; only variants with string names have documentation records. */
export type UnionRefDoc = NamedTypeRefDoc & {
  /** Selects union rendering and link routing. */
  readonly kind: "union";
  /** Original compiler union, including any unnamed variants omitted from `variants`. */
  readonly type: Union;

  /** Template declaration parameters in source order; absent for non-template unions. */
  readonly templateParameters?: readonly TemplateParameterRefDoc[];
  /** Named variants keyed by name, preserving compiler iteration order. */
  readonly variants: ReadonlyMap<string, UnionVariantRefDoc>;
};

/** Named union variant display content, with its value type on the compiler variant. */
export type UnionVariantRefDoc = NamedTypeRefDoc & {
  /** Original compiler variant, not the type selected by that variant. */
  readonly type: UnionVariant;
};

/** Scalar declaration display content with access to its compiler inheritance information. */
export type ScalarRefDoc = NamedTypeRefDoc & {
  /** Selects scalar rendering. */
  readonly kind: "scalar";
  /** Original compiler scalar, including its base scalar when present. */
  readonly type: Scalar;

  /** Optional template documentation supplied by a producer; the extractor currently leaves this unset. */
  readonly templateParameters?: readonly TemplateParameterRefDoc[];
};
