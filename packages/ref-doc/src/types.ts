import {
  Decorator,
  Enum,
  FunctionParameter,
  Interface,
  Model,
  Operation,
  Union,
} from "@cadl-lang/compiler";

export type CadlRefDoc = {
  namespaces: NamespaceRefDoc[];
};

export type NamespaceRefDoc = {
  id: string;
  decorators: DecoratorRefDoc[];
  operations: OperationRefDoc[];
  interfaces: InterfaceRefDoc[];
  models: ModelRefDoc[];
  enums: EnumRefDoc[];
  unions: UnionRefDoc[];
};

export type NamedTypeRefDoc = {
  /**
   * Fully qualified id
   */
  id: string;

  name: string;
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
