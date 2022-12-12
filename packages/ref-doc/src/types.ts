import { Decorator, FunctionParameter, Interface, Model, Operation } from "@cadl-lang/compiler";

export interface CadlRefDoc {
  namespaces: NamespaceRefDoc[];
}

export interface NamespaceRefDoc {
  id: string;
  decorators: DecoratorRefDoc[];
  operations: OperationRefDoc[];
  interfaces: InterfaceRefDoc[];
  models: ModelRefDoc[];
}

export type DecoratorRefDoc = NamedTypeRefDoc & {
  type: Decorator;
  target: FunctionParameterRefDoc;
  parameters: FunctionParameterRefDoc[];
  otherTags: string[];
};

export interface FunctionParameterRefDoc {
  type: FunctionParameter;
  name: string;
  doc: string;
  optional: boolean;
  rest: boolean;
}

export interface ExampleRefDoc {
  title?: string;
  content: string;
}

export type OperationRefDoc = NamedTypeRefDoc & {
  type: Operation;

  templateParameters?: TemplateParameterRefDoc[];
};

export type InterfaceRefDoc = NamedTypeRefDoc & {
  type: Interface;
  templateParameters?: TemplateParameterRefDoc[];
};

export interface TemplateParameterRefDoc {
  name: string;
  doc: string;
}

export type ModelRefDoc = NamedTypeRefDoc & {
  type: Model;

  templateParameters?: TemplateParameterRefDoc[];
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
