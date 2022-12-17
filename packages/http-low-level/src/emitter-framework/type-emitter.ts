import {
  BooleanLiteral,
  Enum,
  EnumMember,
  Interface,
  isTemplateDeclaration,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Program,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "@cadl-lang/compiler";
import { code, CodeBuilder } from "./code-builder.js";
import {
  AssetEmitter,
  CadlDeclaration,
  Context,
  Declaration,
  EmitEntity,
  EmitEntityOrString,
  EmittedSourceFile,
  Scope,
  SourceFile,
} from "./types.js";

export class TypeEmitter {
  constructor(protected emitter: AssetEmitter) {}

  programContext(program: Program) {
    return {};
  }

  namespace(namespace: Namespace): EmitEntityOrString {
    for (const ns of namespace.namespaces.values()) {
      this.emitter.emitType(ns);
    }

    for (const model of namespace.models.values()) {
      if (!isTemplateDeclaration(model)) {
        this.emitter.emitType(model);
      }
    }

    for (const operation of namespace.operations.values()) {
      if (!isTemplateDeclaration(operation)) {
        this.emitter.emitType(operation);
      }
    }

    for (const enumeration of namespace.enums.values()) {
      this.emitter.emitType(enumeration);
    }

    for (const union of namespace.unions.values()) {
      if (!isTemplateDeclaration(union)) {
        this.emitter.emitType(union);
      }
    }

    for (const iface of namespace.interfaces.values()) {
      if (!isTemplateDeclaration(iface)) {
        this.emitter.emitType(iface);
      }
    }
    return this.emitter.result.none();
  }

  namespaceContext(namespace: Namespace): Context {
    return {};
  }

  namespaceReferenceContext(namespace: Namespace): Context {
    return {};
  }

  modelScalar(model: Model, scalarName: string): EmitEntityOrString {
    return this.emitter.result.none();
  }

  modelScalarContext(model: Model, scalarName: string): Context {
    return {};
  }

  modelLiteral(model: Model): EmitEntityOrString {
    if (model.baseModel) {
      this.emitter.emitType(model.baseModel);
    }

    this.emitter.emitModelProperties(model);
    return this.emitter.result.none();
  }

  modelLiteralContext(model: Model): Context {
    return {};
  }

  modelLiteralReferenceContext(model: Model) {
    return {};
  }

  modelDeclaration(model: Model, name: string): EmitEntityOrString {
    if (model.baseModel) {
      this.emitter.emitType(model.baseModel);
    }
    this.emitter.emitModelProperties(model);
    return this.emitter.result.none();
  }

  modelDeclarationContext(model: Model, name: string): Context {
    return {};
  }

  modelDeclarationReferenceContext(model: Model, name: string): Context {
    return {};
  }

  modelInstantiation(model: Model, name: string): EmitEntityOrString {
    if (model.baseModel) {
      this.emitter.emitType(model.baseModel);
    }
    this.emitter.emitModelProperties(model);
    return this.emitter.result.none();
  }

  modelInstantiationContext(model: Model, name: string): Context {
    return {};
  }

  modelInstantiationReferenceContext(model: Model, name: string): Context {
    return {};
  }

  modelProperties(model: Model): EmitEntity {
    const builder = new CodeBuilder();
    let i = 0;
    for (const prop of model.properties.values()) {
      i++;
      builder.push(
        code`${this.emitter.emitModelProperty(prop)}${i < model.properties.size ? "," : ""}`
      );
    }
    return this.emitter.result.rawCode(builder.reduce());
  }

  modelPropertyLiteral(property: ModelProperty): EmitEntityOrString {
    this.emitter.emitTypeReference(property.type);
    return this.emitter.result.none();
  }

  modelPropertyLiteralContext(property: ModelProperty): Context {
    return {};
  }

  modelPropertyLiteralReferenceContext(property: ModelProperty): Context {
    return {};
  }

  modelPropertyReference(property: ModelProperty): EmitEntityOrString {
    return code`${this.emitter.emitTypeReference(property.type)}`;
  }

  booleanLiteralContext(boolean: BooleanLiteral): Context {
    return {};
  }

  booleanLiteral(boolean: BooleanLiteral): EmitEntityOrString {
    return this.emitter.result.none();
  }

  stringLiteralContext(string: StringLiteral): Context {
    return {};
  }

  stringLiteral(string: StringLiteral): EmitEntityOrString {
    return this.emitter.result.none();
  }

  numericLiteralContext(number: NumericLiteral): Context {
    return {};
  }

  numericLiteral(number: NumericLiteral): EmitEntityOrString {
    return this.emitter.result.none();
  }

  operationDeclaration(operation: Operation, name: string): EmitEntityOrString {
    this.emitter.emitOperationParameters(operation);
    this.emitter.emitOperationReturnType(operation);

    return this.emitter.result.none();
  }

  operationDeclarationContext(operation: Operation): Context {
    return {};
  }

  operationDeclarationReferenceContext(operation: Operation): Context {
    return {};
  }

  operationParameters(operation: Operation, parameters: Model): EmitEntityOrString {
    return this.emitter.result.none();
  }

  operationParametersContext(operation: Operation, parameters: Model): Context {
    return {};
  }

  operationParametersReferenceContext(operation: Operation, parameters: Model): Context {
    return {};
  }

  operationReturnType(operation: Operation, returnType: Type): EmitEntityOrString {
    return this.emitter.result.none();
  }

  operationReturnTypeContext(operation: Operation, returnType: Type): Context {
    return {};
  }

  operationReturnTypeReferenceContext(operation: Operation, returnType: Type): Context {
    return {};
  }

  interfaceDeclaration(iface: Interface, name: string): EmitEntityOrString {
    this.emitter.emitInterfaceOperations(iface);
    return this.emitter.result.none();
  }

  interfaceDeclarationContext(iface: Interface): Context {
    return {};
  }

  interfaceDeclarationReferenceContext(iface: Interface): Context {
    return {};
  }

  interfaceDeclarationOperations(iface: Interface): EmitEntityOrString {
    const builder = new CodeBuilder();
    let i = 0;
    for (const op of iface.operations.values()) {
      i++;
      builder.push(
        code`${this.emitter.emitInterfaceOperation(op)}${i < iface.operations.size ? "," : ""}`
      );
    }
    return builder.reduce();
  }

  interfaceOperationDeclaration(operation: Operation, name: string): EmitEntityOrString {
    this.emitter.emitOperationParameters(operation);
    this.emitter.emitOperationReturnType(operation);

    return this.emitter.result.none();
  }

  interfaceOperationDeclarationContext(operation: Operation): Context {
    return {};
  }

  interfaceOperationDeclarationReferenceContext(operation: Operation): Context {
    return {};
  }

  enumDeclaration(en: Enum, name: string): EmitEntityOrString {
    this.emitter.emitEnumMembers(en);
    return this.emitter.result.none();
  }

  enumDeclarationContext(en: Enum): Context {
    return {};
  }

  enumMembers(en: Enum): EmitEntityOrString {
    const builder = new CodeBuilder();
    let i = 0;
    for (const enumMember of en.members.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(enumMember)}${i < en.members.size ? "," : ""}`);
    }
    return builder.reduce();
  }

  enumMember(member: EnumMember): EmitEntityOrString {
    return this.emitter.result.none();
  }

  enumMemberContext(member: EnumMember) {
    return {};
  }

  unionDeclaration(union: Union, name: string): EmitEntityOrString {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  unionDeclarationContext(union: Union): Context {
    return {};
  }

  unionDeclarationReferenceContext(union: Union): Context {
    return {};
  }

  unionInstantiation(union: Union, name: string): EmitEntityOrString {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  unionInstantiationContext(union: Union): Context {
    return {};
  }

  unionInstantiationReferenceContext(union: Union): Context {
    return {};
  }

  unionLiteral(union: Union): EmitEntityOrString {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  unionLiteralContext(union: Union): Context {
    return {};
  }

  unionLiteralReferenceContext(union: Union): Context {
    return {};
  }

  unionVariants(union: Union): EmitEntityOrString {
    const builder = new CodeBuilder();
    let i = 0;
    for (const v of union.variants.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(v)}${i < union.variants.size ? "," : ""}`);
    }
    return builder.reduce();
  }

  unionVariant(variant: UnionVariant): EmitEntityOrString {
    this.emitter.emitTypeReference(variant.type);
    return this.emitter.result.none();
  }
  unionVariantContext(union: Union): Context {
    return {};
  }

  unionVariantReferenceContext(union: Union): Context {
    return {};
  }

  tupleLiteral(tuple: Tuple): EmitEntityOrString {
    this.emitter.emitTupleLiteralValues(tuple);
    return this.emitter.result.none();
  }

  tupleLiteralContext(tuple: Tuple): Context {
    return {};
  }

  tupleLiteralReferenceContext(tuple: Tuple): Context {
    return {};
  }

  tupleLiteralValues(tuple: Tuple): EmitEntityOrString {
    const builder = new CodeBuilder();
    let i = 0;
    for (const v of tuple.values) {
      i++;
      builder.push(code`${this.emitter.emitTypeReference(v)}${i < tuple.values.length ? "," : ""}`);
    }
    return builder.reduce();
  }

  sourceFile(sourceFile: SourceFile): EmittedSourceFile {
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: "",
    };

    for (const decl of sourceFile.globalScope.declarations) {
      emittedSourceFile.contents += decl.code + "\n";
    }

    return emittedSourceFile;
  }

  reference(
    targetDeclaration: Declaration,
    pathUp: Scope[],
    pathDown: Scope[],
    commonScope: Scope | null
  ): EmitEntityOrString {
    const basePath = pathDown.map((s) => s.name).join(".");
    return basePath
      ? this.emitter.result.rawCode(basePath + "." + targetDeclaration.name)
      : this.emitter.result.rawCode(targetDeclaration.name);
  }

  declarationName(declarationType: CadlDeclaration): string {
    if (!declarationType.name) {
      throw new Error("Can't emit a declaration that doesn't have a name");
    }

    if (declarationType.kind === "Enum") {
      return declarationType.name;
    }

    // for operations inside interfaces, we don't want to do the fancy thing because it will make
    // operations inside instantiated interfaces will get get weird names
    if (declarationType.kind === "Operation" && declarationType.interface) {
      return declarationType.name;
    }

    if (
      declarationType.templateArguments === undefined ||
      declarationType.templateArguments.length === 0
    ) {
      return declarationType.name;
    }

    // todo: this probably needs to be a lot more robust
    const parameterNames = declarationType.templateArguments.map((t) => {
      switch (t.kind) {
        case "Model":
          return this.emitter.emitDeclarationName(t);
        default:
          throw new Error(
            "Can't get a name for non-model type used to instantiate a model template"
          );
      }
    });

    return declarationType.name + parameterNames.join("");
  }
}
