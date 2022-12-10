import { Decorator, FunctionParameter } from "@cadl-lang/compiler";

export interface CadlRefDoc {
  namespaces: NamespaceRefDoc[];
}

export interface NamespaceRefDoc {
  fullName: string;
  decorators: DecoratorRefDoc[];
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
