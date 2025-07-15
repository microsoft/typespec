import {
  AssetEmitter,
  Context,
  EmittedSourceFile,
  EmitterOutput,
  Scope,
  SourceFile,
} from "@typespec/asset-emitter";
import type { Model } from "@typespec/compiler";
import { HttpStatusCodeRange } from "@typespec/http";
import { HttpRequestParameterKind } from "@typespec/http/experimental/typekit";
import { CSharpServiceEmitterOptions } from "./lib.js";

export const HelperNamespace: string = "TypeSpec.Helpers.JsonConverters";

export interface CSharpTypeMetadata {
  name: string;
  namespace?: string;
}

export interface ResponseInfo {
  statusCode: number | HttpStatusCodeRange | "*";
  csharpStatusCode: string;
  resultType: CSharpType;
}

export class CSharpType implements CSharpTypeMetadata {
  name: string;
  namespace: string;
  isBuiltIn: boolean;
  isValueType: boolean;
  isNullable: boolean;
  isClass: boolean;
  isCollection: boolean;

  public constructor(input: {
    name: string;
    namespace: string;
    isBuiltIn?: boolean;
    isValueType?: boolean;
    isNullable?: boolean;
    isClass?: boolean;
    isCollection?: boolean;
  }) {
    this.name = input.name;
    this.namespace = input.namespace;
    this.isBuiltIn = input.isBuiltIn !== undefined ? input.isBuiltIn : input.namespace === "System";
    this.isValueType = input.isValueType !== undefined ? input.isValueType : false;
    this.isNullable = input.isNullable !== undefined ? input.isNullable : false;
    this.isClass = input.isClass !== undefined ? input.isClass : false;
    this.isCollection = input.isCollection !== undefined ? input.isCollection : false;
  }

  isNamespaceInScope(scope?: Scope<string>, visited?: Set<Scope<string>>): boolean {
    if (this.isBuiltIn) return true;
    return checkOrAddNamespaceToScope(this.namespace, scope, visited);
  }
  public getTypeReference(scope?: Scope<string>): string {
    return this.isNamespaceInScope(scope) ? this.name : `${this.namespace}.${this.name}`;
  }

  public equals(other: CSharpType | undefined): boolean {
    return this.name === other?.name && this.namespace === other?.namespace;
  }
}

export function checkOrAddNamespaceToScope(
  ns: string,
  scope?: Scope<string>,
  visited?: Set<Scope<string>>,
): boolean {
  if (!ns) return false;
  if (scope === undefined) return false;
  if (!visited) visited = new Set<Scope<string>>();
  if (visited.has(scope)) return false;
  visited.add(scope);

  switch (scope.kind) {
    case "namespace": {
      if (scope.namespace.startsWith(ns)) return true;
      return checkOrAddNamespaceToScope(ns, scope.parentScope, visited);
    }

    case "sourceFile": {
      const fileNameSpace = scope.sourceFile.meta["ResolvedNamespace"];
      if (fileNameSpace && fileNameSpace.startsWith(ns)) return true;
      for (const entry of scope.sourceFile.imports.keys()) {
        if (entry === ns) {
          return true;
        }
      }
      const added: string | undefined = scope.sourceFile.meta["AddedScope"];
      if (added === undefined) {
        scope.sourceFile.imports.set(ns, [ns]);
        scope.sourceFile.meta["AddedScope"] = ns;
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

export enum CollectionType {
  ISet = "ISet",
  ICollection = "ICollection",
  IEnumerable = "IEnumerable",
  Array = "[]",
}

export function resolveCollectionType(option?: string): CollectionType {
  switch (option) {
    case "enumerable":
      return CollectionType.IEnumerable;
    case "array":
    default:
      return CollectionType.Array;
  }
}

export class CSharpCollectionType extends CSharpType {
  collectionType: CollectionType;
  itemTypeName: string;

  static readonly implementationType: Record<CollectionType, string> = {
    [CollectionType.ISet]: "HashSet",
    [CollectionType.ICollection]: "List",
    [CollectionType.IEnumerable]: "List",
    [CollectionType.Array]: "[]",
  };

  public constructor(
    csharpType: {
      name: string;
      namespace: string;
      isBuiltIn?: boolean;
      isValueType?: boolean;
      isNullable?: boolean;
      isClass?: boolean;
      isCollection?: boolean;
    },
    collectionType: CollectionType,
    itemTypeName: string,
  ) {
    super(csharpType);
    this.collectionType = collectionType;
    this.itemTypeName = itemTypeName;
  }

  public getTypeReference(scope?: Scope<string> | undefined): string {
    if (this.isNamespaceInScope(scope)) {
      return this.name;
    }
    return `${this.collectionType}<${this.namespace}.${this.itemTypeName}>`;
  }

  public getImplementationType(): string {
    switch (this.collectionType) {
      case CollectionType.ISet:
      case CollectionType.ICollection:
      case CollectionType.IEnumerable:
        return `new ${CSharpCollectionType.implementationType[this.collectionType]}<${this.itemTypeName}>()`;
      default:
        return `[]`;
    }
  }
}

export abstract class CSharpValue {
  value?: any;
  public abstract emitValue(scope?: Scope<string>): string;
}

export class StringValue extends CSharpValue {
  value?: string;
  public constructor(value?: string) {
    super();
    this.value = value;
  }
  public emitValue(scope?: Scope<string> | undefined): string {
    return `"${this.value}"`;
  }
}

export class RawValue extends CSharpValue {
  value?: string;
  public constructor(value?: string) {
    super();
    this.value = value;
  }
  public emitValue(scope?: Scope<string> | undefined): string {
    return `${this.value}`;
  }
}

export class NumericValue extends CSharpValue {
  value?: number;
  public constructor(value?: number) {
    super();
    this.value = value;
  }
  public emitValue(scope?: Scope<string> | undefined): string {
    return `${this.value ?? 0}`;
  }
}

export class BooleanValue extends CSharpValue {
  value?: boolean;
  public constructor(value?: boolean) {
    super();
    this.value = value;
  }
  public emitValue(scope?: Scope<string> | undefined): string {
    return `${this.value}`;
  }
}

export class NullValue extends CSharpValue {
  value?: null = null;
  public emitValue(scope?: Scope<string> | undefined): string {
    return "null";
  }
}

export class Parameter implements CSharpTypeMetadata {
  type: CSharpType;
  optional: boolean;
  name: string;
  value?: CSharpValue;
  defaultValue?: CSharpValue;

  constructor(input: {
    name: string;
    type: CSharpType;
    optional: boolean;
    value?: CSharpValue;
    defaultValue?: CSharpValue;
  }) {
    this.name = input.name;
    this.type = input.type;
    this.optional = input.optional;
    this.value = input.value;
    this.defaultValue = input.defaultValue;
  }

  public getDeclarationString(scope?: Scope<string>): string {
    const sb: string[] = [];
    sb.push(`${this.type.getTypeReference(scope)}`);
    if (this.optional) sb.push("?");
    sb.push(` ${this.name}`);
    if (this.defaultValue !== undefined) sb.push(` = ${this.defaultValue.emitValue(scope)}`);
    return sb.join(", ");
  }

  public getCallString(scope?: Scope<string>): string {
    if (!this.value) return "";
    const sb: string[] = [];
    if (this.optional) sb.push(`${this.name} = ${this.value.emitValue(scope)}`);
    else sb.push(this.value.emitValue(scope));
    return sb.join(", ");
  }
}

export class AttributeType extends CSharpType {
  public getTypeReference(scope?: Scope<string> | undefined): string {
    const ref = super.getTypeReference(scope);
    const suffixStart = ref.lastIndexOf("Attribute");
    if (suffixStart < 1) return ref;
    return ref.slice(0, suffixStart);
  }
}

export class Attribute {
  type: AttributeType;
  parameters: Parameter[];

  constructor(type: AttributeType, parameters?: Parameter[]) {
    this.type = type;
    this.parameters = parameters === undefined ? [] : parameters;
  }

  public getApplicationString(scope?: Scope<string>): string {
    const sb: string[] = [];
    const parameters: string[] = [];
    sb.push(`[${this.type.getTypeReference(scope)}`);
    for (let i = 0; i < this.parameters.length; ++i) {
      parameters.push(this.parameters[i].getCallString(scope));
    }
    if (parameters.length > 0) sb.push(`( ${parameters.join(", ")})`);
    sb.push("]");
    return sb.join("");
  }
}

export abstract class CSharpDeclaration {
  type: CSharpType;
  emitter: AssetEmitter<string, Record<string, never>>;
  public abstract getDeclaration(scope: Scope<string>): EmitterOutput<string>;
  constructor(type: CSharpType, emitter: AssetEmitter<string, Record<string, never>>) {
    this.type = type;
    this.emitter = emitter;
  }
}

export class CSharpModel extends CSharpDeclaration {
  constructor(
    modelName: string,
    modelNamespace: string,
    emitter: AssetEmitter<string, Record<string, never>>,
  ) {
    super(
      new CSharpType({
        name: modelName,
        namespace: modelNamespace,
        isBuiltIn: false,
        isValueType: false,
      }),
      emitter,
    );
  }
  properties: Parameter[] = [];

  public getDeclaration(scope: Scope<string>): EmitterOutput<string> {
    return "";
  }
}

export class CSharpEnum extends CSharpDeclaration {
  public getDeclaration(scope: Scope<string>): EmitterOutput<string> {
    return "";
  }
}

export class CSharpController extends CSharpDeclaration {
  public getDeclaration(scope: Scope<string>): EmitterOutput<string> {
    return "";
  }
}
export interface ControllerContext extends Context {
  namespace: string;
  resourceName: string;
  resourceType?: Model;
  scope: Scope<string>;
}

export interface ModelContext extends Context {
  file: SourceFile<string>;
  scope: Scope<string>;
  usedNamespaces: Set<string>;
}

export enum CSharpSourceType {
  Model,
  Controller,
  RouteConstants,
  Interface,
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

export class LibrarySourceFile {
  constructor(params: {
    filename: string;
    getContents: () => string;
    emitter: AssetEmitter<string, CSharpServiceEmitterOptions>;
    path?: string;
    conditional?: boolean;
  }) {
    this.path = params.path || "generated/lib/";
    this.filename = params.filename;
    const source = params.emitter.createSourceFile(`${this.path}/${this.filename}`);
    this.conditional = params.conditional || false;
    this.emitted = {
      path: source.path,
      contents: params.getContents(),
    };

    source.meta = { emitted: this.emitted, conditional: this.conditional };
    this.source = source;
  }
  conditional: boolean;
  filename: string;
  source: SourceFile<string>;
  emitted: EmittedSourceFile;
  path: string;
}

export interface CSharpOperationParameter {
  name: string;
  typeName: EmitterOutput<string>;
  optional: boolean;
  httpParameterKind: HttpRequestParameterKind;
  httpParameterName?: string;
  callName: string;
  isExplicitBody: boolean;
  nullable: boolean;
  operationKind: "Http" | "BusinessLogic" | "All";
  defaultValue?: string | boolean;
}
