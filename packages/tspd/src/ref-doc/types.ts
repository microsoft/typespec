import {
  Decorator,
  Enum,
  FunctionParameter,
  Interface,
  LinterRuleDefinition,
  LinterRuleSet,
  Model,
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
  name: string;

  /**
   * Library package.json
   */
  packageJson: NodePackage;

  /**
   * Library description
   */
  description?: string;

  emitter?: EmitterRefDoc;

  /** Documentation about the linter rules and ruleset provided in this library. */
  linter?: LinterRefDoc;
};

export type TypeSpecRefDocBase = {
  namespaces: NamespaceRefDoc[];
};

export type EmitterRefDoc = {
  options: EmitterOptionRefDoc[];
};

export type LinterRefDoc = {
  /** List of rulesets provided. */
  ruleSets?: LinterRuleSetRefDoc[];
  rules: LinterRuleRefDoc[];
};

export type LinterRuleSetRefDoc = ReferencableElement & {
  ruleSet: LinterRuleSet;
};
export type LinterRuleRefDoc = ReferencableElement & {
  rule: LinterRuleDefinition<any, any>;
};

export type EmitterOptionRefDoc = {
  name: string;
  type: string;
  doc: string;
};

export type NamespaceRefDoc = {
  id: string;
  decorators: DecoratorRefDoc[];
  operations: OperationRefDoc[];
  interfaces: InterfaceRefDoc[];
  models: ModelRefDoc[];
  enums: EnumRefDoc[];
  unions: UnionRefDoc[];
  scalars: ScalarRefDoc[];
};

export type ReferencableElement = {
  /**
   * Fully qualified id
   */
  id: string;

  name: string;
};

export type NamedTypeRefDoc = ReferencableElement & {
  signature: string;
  doc: string;
  examples: ExampleRefDoc[];
};

export type DecoratorRefDoc = NamedTypeRefDoc & {
  type: Decorator;
  target: FunctionParameterRefDoc;
  parameters: FunctionParameterRefDoc[];
  otherTags: string[];
};

export type FunctionParameterRefDoc = {
  type: FunctionParameter;
  name: string;
  doc: string;
  optional: boolean;
  rest: boolean;
};

export type ExampleRefDoc = {
  title?: string;
  content: string;
};

export type OperationRefDoc = NamedTypeRefDoc & {
  type: Operation;

  templateParameters?: TemplateParameterRefDoc[];
};

export type InterfaceRefDoc = NamedTypeRefDoc & {
  type: Interface;
  templateParameters?: TemplateParameterRefDoc[];

  interfaceOperations: OperationRefDoc[];
};

export type TemplateParameterRefDoc = {
  name: string;
  doc: string;
};

export type ModelRefDoc = NamedTypeRefDoc & {
  type: Model;

  templateParameters?: TemplateParameterRefDoc[];
};

export type EnumRefDoc = NamedTypeRefDoc & {
  type: Enum;
};

export type UnionRefDoc = NamedTypeRefDoc & {
  type: Union;

  templateParameters?: TemplateParameterRefDoc[];
};

export type ScalarRefDoc = NamedTypeRefDoc & {
  type: Scalar;

  templateParameters?: TemplateParameterRefDoc[];
};
