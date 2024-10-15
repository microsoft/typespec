import { Contact, License } from "@typespec/openapi";
import { OpenAPI3Encoding, OpenAPI3Schema, Refable } from "../../../types.js";

export interface TypeSpecProgram {
  serviceInfo: TypeSpecServiceInfo;
  namespaces: Record<string, TypeSpecNamespace>;
  types: TypeSpecDataTypes[];
  augmentations: TypeSpecAugmentation[];
  operations: TypeSpecOperation[];
}

export interface TypeSpecDeclaration {
  name: string;
  doc?: string;
  decorators: TypeSpecDecorator[];
  scope: string[];
}

export interface TypeSpecNamespace {
  namespaces: Record<string, TypeSpecNamespace>;
  types: TypeSpecDataTypes[];
  operations: TypeSpecOperation[];
}

export interface TypeSpecServiceInfo {
  name: string;
  doc?: string;
  version: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  summary?: string;
}

export interface TypeSpecDecorator {
  name: string;
  args: (object | number | string)[];
}

export interface TypeSpecAugmentation extends TypeSpecDecorator {
  target: string;
}

export type TypeSpecDataTypes =
  | TypeSpecAlias
  | TypeSpecEnum
  | TypeSpecModel
  | TypeSpecScalar
  | TypeSpecUnion;

export interface TypeSpecModel extends TypeSpecDeclaration {
  kind: "model";

  properties: TypeSpecModelProperty[];
  additionalProperties?: Refable<OpenAPI3Schema>;
  /**
   * Note: Only one of `extends` or `is` should be specified.
   */
  extends?: string;
  /**
   * Note: Only one of `extends` or `is` should be specified.
   */
  is?: string;
  /**
   * Defaults to 'object'
   */
  type?: OpenAPI3Schema["type"];

  spread?: string[];
}

export interface TypeSpecAlias extends Pick<TypeSpecDeclaration, "name" | "doc" | "scope"> {
  kind: "alias";
  ref: string;
}

export interface TypeSpecEnum extends TypeSpecDeclaration {
  kind: "enum";
  schema: OpenAPI3Schema;
}

export interface TypeSpecUnion extends TypeSpecDeclaration {
  kind: "union";
  schema: OpenAPI3Schema;
}

export interface TypeSpecScalar extends TypeSpecDeclaration {
  kind: "scalar";
  schema: OpenAPI3Schema;
}

export interface TypeSpecModelProperty {
  name: string;
  isOptional: boolean;
  doc?: string;
  /**
   * A partial list of decorators that can't be ascertained from
   * the schema.
   * Example: location decorators for parameters
   */
  decorators: TypeSpecDecorator[];
  schema: Refable<OpenAPI3Schema>;
}

export interface TypeSpecOperation extends TypeSpecDeclaration {
  operationId?: string;
  parameters: Refable<TypeSpecOperationParameter>[];
  requestBodies: TypeSpecRequestBody[];
  responseTypes: string[];
  tags: string[];
}

export interface TypeSpecOperationParameter {
  name: string;
  in: string;
  doc?: string;
  decorators: TypeSpecDecorator[];
  isOptional: boolean;
  schema: Refable<OpenAPI3Schema>;
}

export interface TypeSpecRequestBody {
  contentType: string;
  doc?: string;
  isOptional: boolean;
  encoding?: Record<string, OpenAPI3Encoding>;
  schema?: Refable<OpenAPI3Schema>;
}
