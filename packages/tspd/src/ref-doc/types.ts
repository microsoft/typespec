import {
  Decorator,
  Enum,
  FunctionParameter,
  Interface,
  LinterRuleDefinition,
  LinterRuleSet,
  Model,
  ModelProperty,
  NodePackage,
  Operation,
  Scalar,
  Union,
} from "@typespec/compiler";

export type TypeSpecRefDoc = TypeSpecLibraryRefDoc;

export type TypeSpecLibraryRefDoc = TypeSpecRefDocBase & {
  /**
   * Library name
   */
  readonly name: string;

  /**
   * Library package.json
   */
  readonly packageJson: NodePackage;

  /**
   * Library description
   */
  readonly description?: string;

  readonly emitter?: EmitterRefDoc;

  /** Documentation about the linter rules and ruleset provided in this library. */
  readonly linter?: LinterRefDoc;
};

export type TypeSpecRefDocBase = {
  readonly namespaces: readonly NamespaceRefDoc[];
};

export type EmitterRefDoc = {
  readonly options: EmitterOptionRefDoc[];
};

export type LinterRefDoc = {
  /** List of rulesets provided. */
  readonly ruleSets?: LinterRuleSetRefDoc[];
  readonly rules: LinterRuleRefDoc[];
};

export type LinterRuleSetRefDoc = ReferencableElement & {
  readonly ruleSet: LinterRuleSet;
};
export type LinterRuleRefDoc = ReferencableElement & {
  readonly rule: LinterRuleDefinition<any, any>;
};

export type EmitterOptionRefDoc = {
  readonly name: string;
  readonly type: string;
  readonly doc: string;
};

export type NamespaceRefDoc = {
  readonly id: string;
  readonly decorators: readonly DecoratorRefDoc[];
  readonly operations: readonly OperationRefDoc[];
  readonly interfaces: readonly InterfaceRefDoc[];
  readonly models: readonly ModelRefDoc[];
  readonly enums: readonly EnumRefDoc[];
  readonly unions: readonly UnionRefDoc[];
  readonly scalars: readonly ScalarRefDoc[];
};

export type ReferencableElement = {
  /**
   * Fully qualified id
   */
  readonly id: string;

  readonly name: string;
};

export type NamedTypeRefDoc = ReferencableElement & {
  readonly signature: string;
  readonly doc: string;
  readonly examples: readonly ExampleRefDoc[];
};

export type DecoratorRefDoc = NamedTypeRefDoc & {
  readonly type: Decorator;
  readonly target: FunctionParameterRefDoc;
  readonly parameters: readonly FunctionParameterRefDoc[];
  readonly otherTags: readonly string[];
};

export type FunctionParameterRefDoc = {
  readonly type: FunctionParameter;
  readonly name: string;
  readonly doc: string;
  readonly optional: boolean;
  readonly rest: boolean;
};

export type ExampleRefDoc = {
  readonly title?: string;
  readonly content: string;
};

export type OperationRefDoc = NamedTypeRefDoc & {
  readonly type: Operation;

  readonly templateParameters?: TemplateParameterRefDoc[];
};

export type InterfaceRefDoc = NamedTypeRefDoc & {
  readonly type: Interface;
  readonly templateParameters?: readonly TemplateParameterRefDoc[];

  readonly interfaceOperations: readonly OperationRefDoc[];
};

export type TemplateParameterRefDoc = {
  readonly name: string;
  readonly doc: string;
};

export type ModelRefDoc = NamedTypeRefDoc & {
  readonly type: Model;

  readonly templateParameters?: readonly TemplateParameterRefDoc[];
  readonly properties: ReadonlyMap<string, ModelPropertyRefDoc>;
};

export type ModelPropertyRefDoc = NamedTypeRefDoc & {
  readonly type: ModelProperty;
};

export type TypeRefDocRef = {
  id: string;
  name: string;
};

export type EnumRefDoc = NamedTypeRefDoc & {
  readonly type: Enum;
};

export type UnionRefDoc = NamedTypeRefDoc & {
  readonly type: Union;

  readonly templateParameters?: readonly TemplateParameterRefDoc[];
};

export type ScalarRefDoc = NamedTypeRefDoc & {
  readonly type: Scalar;

  readonly templateParameters?: readonly TemplateParameterRefDoc[];
};
