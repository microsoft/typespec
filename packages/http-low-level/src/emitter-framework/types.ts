import { Program, Type, Model, ModelProperty, Operation, Union, Enum, Interface, Tuple } from "@cadl-lang/compiler";
import { CodeBuilder } from "./code-builder.js";
import { TypeEmitter } from "./type-emitter.js";

export interface EmitContext {
  program: Program;
  AssetTag: AssetTag;
  createAssetEmitter(
    TypeEmitterClass: typeof TypeEmitter,
    ...tags: AssetTagInstance[]
  ): AssetEmitter;
}

export interface AssetEmitter {
  getContext(): Context;
  getProgram(): Program;
  emitTypeReference(type: Type): EmitEntity;
  emitDeclarationName(type: CadlDeclaration): string;
  emitType(type: Type): EmitEntity;
  emitProgram(options?: {
    emitGlobalNamespace?: boolean;
    emitCadlNamespace?: boolean;
  }): void;
  emitModelProperties(model: Model): EmitEntity;
  emitModelProperty(prop: ModelProperty): EmitEntity;
  emitOperationParameters(operation: Operation): EmitEntity;
  emitOperationReturnType(operation: Operation): EmitEntity;
  emitInterfaceOperations(iface: Interface): EmitEntity;
  emitInterfaceOperation(operation: Operation): EmitEntity;
  emitEnumMembers(en: Enum): EmitEntity;
  emitUnionVariants(union: Union): EmitEntity;
  emitTupleLiteralValues(tuple: Tuple): EmitEntity;
  createSourceFile(name: string): SourceFile;
  createScope(sourceFile: SourceFile, name: string): SourceFileScope;
  createScope(namespace: any, name: string, parentScope: Scope): NamespaceScope;
  createScope(block: any, name: string, parentScope?: Scope | null): Scope;
  result: {
    declaration(name: string, code: string | CodeBuilder): Declaration;
    rawCode(code: string | CodeBuilder): RawCode;
    none(): NoEmit;
  };
  writeOutput(): Promise<void>;
}

export interface ScopeBase {
  kind: string;
  name: string;
  parentScope: Scope | null;
  childScopes: Scope[];
  declarations: Declaration[];
}

export interface SourceFileScope extends ScopeBase {
  kind: "sourceFile";
  sourceFile: SourceFile;
}

export interface NamespaceScope extends ScopeBase {
  kind: "namespace";
  namespace: any;
}

export type Scope = SourceFileScope | NamespaceScope;

export interface TypeReference {
  expression: string;
}

export interface SourceFile {
  path: string;
  globalScope: Scope;
  imports: Map<string, string[]>;
}

export interface EmittedSourceFile {
  contents: string;
  path: string;
}

export type EmitEntity =
  | Declaration
  | Literal
  | RawCode
  | NoEmit
  | CircularEmit;

export type EmitEntityOrString = EmitEntity | string | CodeBuilder;

export type Declaration = {
  kind: "declaration";
  scope: Scope;
  name: string;
  code: string | CodeBuilder;
};

export type Literal = {
  kind: "literal";
  code: string | CodeBuilder;
};

export type RawCode = {
  kind: "code";
  code: string | CodeBuilder;
};

export type NoEmit = {
  kind: "none";
  code: "";
};

export type CircularEmit = {
  kind: "circular";
  emitEntityKey: [string, Type, ContextState];
};

export interface AssetTag {
  language: AssetTagFactory;
  create(key: string): AssetTagFactory;
}

export interface AssetTagInstance {}

export type AssetTagFactory = {
  (value: string): AssetTagInstance;
};

export type CadlDeclaration = Model | Interface | Union | Operation | Enum;


export interface ContextState {
  lexicalContext: Record<string, any>;
  referenceContext: Record<string, any>;
}

export type Context = Record<string, any>;
export type ESRecord = Record<string, any> & { _record: true };

export interface EmitterState {
  lexicalTypeStack: Type[],
  context: ContextState
}