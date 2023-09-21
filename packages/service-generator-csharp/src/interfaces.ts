import { Model } from "@typespec/compiler";
import { Context, Scope, SourceFile } from "@typespec/compiler/emitter-framework";

export const HelperNamespace: string = "Microsoft.TypeSpec.ProviderHub.Controller";
export class CSharpType {
  name: string;
  namespace: string;
  isBuiltIn: boolean;
  isValueType: boolean;

  constructor(input: {
    name: string;
    namespace: string;
    isBuiltIn?: boolean;
    isValueType: boolean;
  }) {
    this.name = input.name;
    this.namespace = input.namespace;
    this.isBuiltIn = input.isBuiltIn !== undefined ? input.isBuiltIn : input.namespace === "System";
    this.isValueType = input.isValueType;
  }

  getTypeReference(): string {
    return `${this.isBuiltIn ? "" : this.namespace + "."}${this.name}`;
  }

  equals(other: CSharpType | undefined): boolean {
    return this.name === other?.name && this.namespace === other?.namespace;
  }
}

export interface ValueParameter {
  type: CSharpType;
  value: any;
}

export interface Attribute {
  namespace: string;
  name: string;
  parameters: ValueParameter[];
}

export interface ControllerContext extends Context {
  file: SourceFile<string>;
  resourceName: string;

  resourceType?: Model;

  scope: Scope<string>;
}

export enum CSharpSourceType {
  Model,
  Controller,
  RouteConstants,
  OperationState,
  OperationStatus,
  ResourceOperationStatus,
}

export enum NameCasingType {
  Class,
  Constant,
  Method,
  Namespace,
  Parameter,
  Property,
  Variable,
}
