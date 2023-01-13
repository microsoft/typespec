import {
  BooleanLiteral,
  Enum,
  EnumMember,
  Interface,
  IntrinsicType,
  isTemplateDeclaration,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Program,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "../core/index.js";
import { code, StringBuilder } from "./builders/string.js";
import { Placeholder } from "./placeholder.js";
import {
  AssetEmitter,
  CadlDeclaration,
  Context,
  Declaration,
  EmitEntity,
  EmittedSourceFile,
  Scope,
  SourceFile,
} from "./types.js";

export type EmitterOutput<T> = EmitEntity<T> | Placeholder<T> | T;

export class TypeEmitter<T> {
  constructor(protected emitter: AssetEmitter<T>) {}

  programContext(program: Program) {
    return {};
  }

  namespace(namespace: Namespace): EmitterOutput<T> {
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

  modelLiteral(model: Model): EmitterOutput<T> {
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

  modelDeclaration(model: Model, name: string): EmitterOutput<T> {
    if (model.baseModel) {
      this.emitter.emitType(model.baseModel);
    }
    this.emitter.emitModelProperties(model);
    return this.emitter.result.none();
  }

  modelDeclarationContext(model: Model, name: string): Context {
    return {};
  }

  modelDeclarationReferenceContext(model: Model): Context {
    return {};
  }

  modelInstantiation(model: Model, name: string): EmitterOutput<T> {
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

  modelProperties(model: Model): EmitterOutput<T> {
    for (const prop of model.properties.values()) {
      this.emitter.emitModelProperty(prop);
    }
    return this.emitter.result.none();
  }

  modelPropertyLiteral(property: ModelProperty): EmitterOutput<T> {
    this.emitter.emitTypeReference(property.type);
    return this.emitter.result.none();
  }

  modelPropertyLiteralContext(property: ModelProperty): Context {
    return {};
  }

  modelPropertyLiteralReferenceContext(property: ModelProperty): Context {
    return {};
  }

  modelPropertyReference(property: ModelProperty): EmitterOutput<T> {
    return this.emitter.emitTypeReference(property.type);
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<T> {
    if (scalar.baseScalar) {
      this.emitter.emitType(scalar.baseScalar);
    }
    return this.emitter.result.none();
  }

  scalarDeclarationContext(scalar: Scalar): Context {
    return {};
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  intrinsicContext(intrinsic: IntrinsicType): Context {
    return {};
  }
  booleanLiteralContext(boolean: BooleanLiteral): Context {
    return {};
  }

  booleanLiteral(boolean: BooleanLiteral): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  stringLiteralContext(string: StringLiteral): Context {
    return {};
  }

  stringLiteral(string: StringLiteral): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  numericLiteralContext(number: NumericLiteral): Context {
    return {};
  }

  numericLiteral(number: NumericLiteral): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  operationDeclaration(operation: Operation, name: string): EmitterOutput<T> {
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

  operationParameters(operation: Operation, parameters: Model): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  operationParametersContext(operation: Operation, parameters: Model): Context {
    return {};
  }

  operationParametersReferenceContext(operation: Operation, parameters: Model): Context {
    return {};
  }

  operationReturnType(operation: Operation, returnType: Type): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  operationReturnTypeContext(operation: Operation, returnType: Type): Context {
    return {};
  }

  operationReturnTypeReferenceContext(operation: Operation, returnType: Type): Context {
    return {};
  }

  interfaceDeclaration(iface: Interface, name: string): EmitterOutput<T> {
    this.emitter.emitInterfaceOperations(iface);
    return this.emitter.result.none();
  }

  interfaceDeclarationContext(iface: Interface): Context {
    return {};
  }

  interfaceDeclarationReferenceContext(iface: Interface): Context {
    return {};
  }

  interfaceDeclarationOperations(iface: Interface): EmitterOutput<T> {
    for (const op of iface.operations.values()) {
      this.emitter.emitInterfaceOperation(op);
    }
    return this.emitter.result.none();
  }

  interfaceOperationDeclaration(operation: Operation, name: string): EmitterOutput<T> {
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

  enumDeclaration(en: Enum, name: string): EmitterOutput<T> {
    this.emitter.emitEnumMembers(en);
    return this.emitter.result.none();
  }

  enumDeclarationContext(en: Enum): Context {
    return {};
  }

  enumMembers(en: Enum): EmitterOutput<T> {
    for (const member of en.members.values()) {
      this.emitter.emitType(member);
    }
    return this.emitter.result.none();
  }

  enumMember(member: EnumMember): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  enumMemberContext(member: EnumMember) {
    return {};
  }

  unionDeclaration(union: Union, name: string): EmitterOutput<T> {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  unionDeclarationContext(union: Union): Context {
    return {};
  }

  unionDeclarationReferenceContext(union: Union): Context {
    return {};
  }

  unionInstantiation(union: Union, name: string): EmitterOutput<T> {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  unionInstantiationContext(union: Union): Context {
    return {};
  }

  unionInstantiationReferenceContext(union: Union): Context {
    return {};
  }

  unionLiteral(union: Union): EmitterOutput<T> {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  unionLiteralContext(union: Union): Context {
    return {};
  }

  unionLiteralReferenceContext(union: Union): Context {
    return {};
  }

  unionVariants(union: Union): EmitterOutput<T> {
    for (const variant of union.variants.values()) {
      this.emitter.emitType(variant);
    }
    return this.emitter.result.none();
  }

  unionVariant(variant: UnionVariant): EmitterOutput<T> {
    this.emitter.emitTypeReference(variant.type);
    return this.emitter.result.none();
  }
  unionVariantContext(union: Union): Context {
    return {};
  }

  unionVariantReferenceContext(union: Union): Context {
    return {};
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<T> {
    this.emitter.emitTupleLiteralValues(tuple);
    return this.emitter.result.none();
  }

  tupleLiteralContext(tuple: Tuple): Context {
    return {};
  }

  tupleLiteralValues(tuple: Tuple): EmitterOutput<T> {
    for (const value of tuple.values.values()) {
      this.emitter.emitType(value);
    }
    return this.emitter.result.none();
  }

  tupleLiteralReferenceContext(tuple: Tuple): Context {
    return {};
  }

  sourceFile(sourceFile: SourceFile<T>): EmittedSourceFile {
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: "",
    };

    for (const decl of sourceFile.globalScope.declarations) {
      emittedSourceFile.contents += decl.value + "\n";
    }

    return emittedSourceFile;
  }

  reference(
    targetDeclaration: Declaration<T>,
    pathUp: Scope<T>[],
    pathDown: Scope<T>[],
    commonScope: Scope<T> | null
  ): EmitEntity<T> | T {
    return this.emitter.result.none();
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

    if (!declarationType.templateMapper) {
      return declarationType.name;
    }

    const parameterNames = declarationType.templateMapper.args.map((t) => {
      switch (t.kind) {
        case "Model":
        case "Scalar":
        case "Interface":
        case "Operation":
        case "Enum":
        case "Union":
          return this.emitter.emitDeclarationName(t);
        default:
          throw new Error(
            `Can't get a name for non-declaration type ${t.kind} used to instantiate a model template`
          );
      }
    });

    return declarationType.name + parameterNames.join("");
  }

  /**
   * Coerces an emit entity to a value. If the emit entity has a value (i.e. is
   * a declaration or code), and that value is not a placeholder, return the value.
   * Otherwise, return null.
   *
   * @param entity The entity to get the value from
   * @returns Either the value, or null if there is no value
   */
  emitValue(entity: EmitEntity<T>): T | null {
    switch (entity.kind) {
      case "declaration":
      case "code":
        if (entity.value instanceof Placeholder) {
          return null;
        }
        return entity.value;
      default:
        return null;
    }
  }
}

export class CodeTypeEmitter extends TypeEmitter<string> {
  modelProperties(model: Model): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const prop of model.properties.values()) {
      i++;
      const propVal = this.emitter.emitModelProperty(prop);
      builder.push(code`${propVal}${i < model.properties.size ? "," : ""}`);
    }
    return this.emitter.result.rawCode(builder.reduce());
  }

  interfaceDeclarationOperations(iface: Interface): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const op of iface.operations.values()) {
      i++;
      builder.push(
        code`${this.emitter.emitInterfaceOperation(op)}${i < iface.operations.size ? "," : ""}`
      );
    }
    return builder.reduce();
  }

  enumMembers(en: Enum): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const enumMember of en.members.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(enumMember)}${i < en.members.size ? "," : ""}`);
    }
    return builder.reduce();
  }

  unionVariants(union: Union): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const v of union.variants.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(v)}${i < union.variants.size ? "," : ""}`);
    }
    return builder.reduce();
  }

  tupleLiteralValues(tuple: Tuple): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const v of tuple.values) {
      i++;
      ``;
      builder.push(code`${this.emitter.emitTypeReference(v)}${i < tuple.values.length ? "," : ""}`);
    }
    return builder.reduce();
  }

  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null
  ): string | EmitEntity<string> {
    const basePath = pathDown.map((s) => s.name).join(".");
    return basePath
      ? this.emitter.result.rawCode(basePath + "." + targetDeclaration.name)
      : this.emitter.result.rawCode(targetDeclaration.name);
  }
}
