import { Decorator, FunctionParameter, Interface, Operation } from "@cadl-lang/compiler";

export interface CadlRefDoc {
  namespaces: NamespaceRefDoc[];
}

export interface NamespaceRefDoc {
  fullName: string;
  decorators: DecoratorRefDoc[];
  operations: OperationRefDoc[];
  interfaces: InterfaceRefDoc[];
}

export interface DecoratorRefDoc {
  type: Decorator;
  /**
   * Fully qualified name of decorator in format `<namespace>.<sub-namespace>.<dec-name>`
   */
  id: string;
  signature: string;
  name: string;
  target: FunctionParameterRefDoc;
  doc: string;
  parameters: FunctionParameterRefDoc[];
  examples: ExampleRefDoc[];
  otherTags: string[];
}

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

export interface OperationRefDoc {
  type: Operation;

  /**
   * Fully qualified name of operation in format `<namespace>.<sub-namespace>[.interfaceName].<dec-name>`
   */
  id: string;

  name: string;

  signature: string;

  templateParameters?: TemplateParameterRefDoc[];

  doc: string;

  examples: ExampleRefDoc[];
}

export interface InterfaceRefDoc {
  type: Interface;

  /**
   * Fully qualified name of operation in format `<namespace>.<sub-namespace>[.interfaceName].<dec-name>`
   */
  id: string;

  name: string;

  signature: string;

  templateParameters?: TemplateParameterRefDoc[];

  doc: string;

  examples: ExampleRefDoc[];
}

export interface TemplateParameterRefDoc {
  name: string;
  doc: string;
}
