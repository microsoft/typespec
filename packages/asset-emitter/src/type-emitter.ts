import {
  compilerAssert,
  emitFile,
  isTemplateDeclaration,
  type BooleanLiteral,
  type Enum,
  type EnumMember,
  type Interface,
  type IntrinsicType,
  type Model,
  type ModelProperty,
  type Namespace,
  type NumericLiteral,
  type Operation,
  type Program,
  type Scalar,
  type StringLiteral,
  type StringTemplate,
  type Tuple,
  type Type,
  type Union,
  type UnionVariant,
} from "@typespec/compiler";
import type { Context } from "vm";
import { StringBuilder, code } from "./builders/string-builder.js";
import type { Placeholder } from "./placeholder.js";
import { resolveDeclarationReferenceScope } from "./ref-scope.js";
import { ReferenceCycle } from "./reference-cycle.js";
import type {
  AssetEmitter,
  Declaration,
  EmitEntity,
  EmittedSourceFile,
  Scope,
  SourceFile,
  TypeSpecDeclaration,
} from "./types.js";

/**
 * Callback output, either an explicit emit result or an inline value.
 * The coordinator wraps bare values and placeholders in raw-code results.
 */
export type EmitterOutput<T> = EmitEntity<T> | Placeholder<T> | T;

/**
 * Implement emitter logic by extending this class and passing it to
 * `createAssetEmitter`. This class should not be constructed
 * directly.
 *
 * TypeEmitters serve two primary purposes:
 *
 * 1. Handle emitting TypeSpec types into other languages
 * 2. Set emitter context
 *
 * The generic type parameter `T` is the type you expect to produce for each TypeSpec type.
 * In the case of generating source code for a programming language, this is probably `string`
 * (in which case, consider using the `CodeTypeEmitter`) but might also be an AST node. If you
 * are emitting JSON or similar, `T` would likely be `object`.
 *
 * ## Emitting types
 *
 * Emitting TypeSpec types into other languages is accomplished by implementing
 * the AssetEmitter method that corresponds with the TypeSpec type you are
 * emitting. For example, to emit a TypeSpec model declaration, implement the
 * `modelDeclaration` method.
 *
 * TypeSpec types that have both declaration and literal forms like models or
 * unions will have separate methods. For example, models have both
 * `modelDeclaration` and `modelLiteral` methods that can be implemented
 * separately.
 *
 * Also, types which can be instantiated like models or operations have a
 * separate method for the instantiated type. For example, models have a
 * `modelInstantiation` method that gets called with such types. Generally these
 * will be treated either as if they were declarations or literals depending on
 * preference, but may also be treated specially.
 *
 * ## Emitter results
 * There are three kinds of results your methods might return - declarations,
 * raw code, or nothing.
 *
 * ### Declarations
 *
 * Create declarations by calling `this.emitter.result.declaration` passing it a
 * name and the emit output for the declaration. Note that you must have scope
 * in your context or you will get an error. If you want all declarations to be
 * emitted to the same source file, you can create a single scope in
 * `programContext` via something like:
 *
 * ```typescript
 * programContext(program: Program): Context {
 *   const sourceFile = this.emitter.createSourceFile("test.txt");
 *   return {
 *     scope: sourceFile.globalScope,
 *   };
 * }
 * ```
 *
 * ### Raw Code
 *
 * Create raw code, or emitter output that doesn't contribute to a declaration,
 * by calling `this.emitter.result.rawCode` passing it a value. Returning just a
 * value is considered raw code and so you often don't need to call this
 * directly.
 *
 * ### No Emit
 *
 * When a type doesn't contribute anything to the emitted output, return
 * `this.emitter.result.none()`.
 *
 * ## Context
 *
 * The TypeEmitter will often want to keep track of what context a type is found
 * in. There are two kinds of context - lexical context, and reference context.
 *
 * * Lexical context is context that applies to the type and every type
 *   contained inside of it. For example, lexical context for a model will apply
 *   to the model, its properties, and any nested model literals.
 * * Reference context is context that applies to types contained inside of the
 *   type and referenced anywhere inside of it. For example, reference context
 *   set on a model will apply to the model, its properties, any nested model
 *   literals, and any type referenced inside anywhere inside the model and any
 *   of the referenced types' references.
 *
 * In both cases, context is an object. It's strongly recommended that the context
 * object either contain only primitive types, or else only reference immutable
 * objects.
 *
 * Set lexical by implementing the `*Context` methods of the TypeEmitter and
 * returning the context, for example `modelDeclarationContext` sets the context
 * for model declarations and the types contained inside of it.
 *
 * Set reference context by implementing the `*ReferenceContext` methods of the
 * TypeEmitter and returning the context. Note that not all types have reference
 * context methods, because not all types can actually reference anything.
 *
 * When a context method returns some context, it is merged with the current
 * context. It is not possible to remove previous context, but it can be
 * overridden with `undefined`.
 *
 * When emitting types with context, the same type might be emitted multiple
 * times if we come across that type with different contexts. For example, if we
 * have a TypeSpec program like
 *
 * ```typespec
 * model Pet { }
 * model Person {
 *   pet: Pet;
 * }
 * ```
 *
 * And we set reference context for the Person model, Pet will be emitted twice,
 * once without context and once with the reference context.
 *
 * ## Callback lifecycle
 *
 * The coordinator establishes context before invoking an emit callback and caches
 * its result by callback, type, and context. Context hooks may themselves be cached;
 * they should compute context, not perform output side effects. Their default
 * implementations return empty objects. Request child emission through
 * `this.emitter` so context and result caching remain active.
 *
 * Named declarations establish their own lexical containment chain. Literals
 * retain the surrounding chain, as do model and union instantiations for which
 * `declarationName` returns undefined. Reference context crosses declaration
 * boundaries, while lexical context is recomputed from the target's containers.
 * Source-file serialization and writing happen separately from traversal.
 */
export class TypeEmitter<T, TOptions extends object = Record<string, never>> {
  /**
   * @private
   *
   * Constructs a TypeEmitter. Do not use this constructor directly, instead
   * call `createAssetEmitter` on the emitter context object.
   * @param emitter The asset emitter
   */
  constructor(protected emitter: AssetEmitter<T, TOptions>) {}

  /**
   * Context shared by the entire program. In cases where you are emitting to a
   * single file, use this method to establish your main source file and set the
   * `scope` property to that source file's `globalScope`.
   * @param program
   * @returns Context
   */
  programContext(program: Program): Context {
    return {};
  }

  /**
   * Emit a namespace
   *
   * @param namespace
   * @returns Emitter output
   */
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

    for (const scalar of namespace.scalars.values()) {
      this.emitter.emitType(scalar);
    }

    return this.emitter.result.none();
  }

  /**
   * Set lexical context for a namespace
   *
   * @param namespace
   */
  namespaceContext(namespace: Namespace): Context {
    return {};
  }

  /**
   * Set reference context for a namespace.
   *
   * @param namespace
   */
  namespaceReferenceContext(namespace: Namespace): Context {
    return {};
  }

  /**
   * Emit a model literal (e.g. as created by `{}` syntax in TypeSpec).
   *
   * @param model
   */
  modelLiteral(model: Model): EmitterOutput<T> {
    if (model.baseModel) {
      this.emitter.emitType(model.baseModel);
    }

    this.emitter.emitModelProperties(model);
    return this.emitter.result.none();
  }

  /**
   * Set lexical context for a model literal.
   * @param model
   */
  modelLiteralContext(model: Model): Context {
    return {};
  }

  /**
   * Set reference context for a model literal.
   * @param model
   */
  modelLiteralReferenceContext(model: Model): Context {
    return {};
  }

  /**
   * Emit a model declaration (e.g. as created by `model Foo { }` syntax in
   * TypeSpec).
   *
   * @param model
   */
  modelDeclaration(model: Model, name: string): EmitterOutput<T> {
    if (model.baseModel) {
      this.emitter.emitType(model.baseModel);
    }
    this.emitter.emitModelProperties(model);
    return this.emitter.result.none();
  }

  /**
   * Set lexical context for a model declaration.
   *
   * @param model
   * @param name the model's declaration name as retrieved from the
   * `declarationName` method.
   */
  modelDeclarationContext(model: Model, name: string): Context {
    return {};
  }

  /**
   * Set reference context for a model declaration.
   * @param model
   */
  modelDeclarationReferenceContext(model: Model, name: string): Context {
    return {};
  }

  /**
   * Emit a model instantiation (e.g. as created by `Box<string>` syntax in
   * TypeSpec). In some cases, `name` is undefined because a good name could
   * not be found for the instantiation. This often occurs with for instantiations
   * involving type expressions like `Box<string | int32>`.
   *
   * @param model
   * @param name The name of the instantiation as retrieved from the
   * `declarationName` method.
   */
  modelInstantiation(model: Model, name: string | undefined): EmitterOutput<T> {
    if (model.baseModel) {
      this.emitter.emitType(model.baseModel);
    }
    this.emitter.emitModelProperties(model);
    return this.emitter.result.none();
  }

  /**
   * Set lexical context for a model instantiation.
   * @param model
   */
  modelInstantiationContext(model: Model, name: string | undefined): Context {
    return {};
  }

  /**
   * Set reference context for a model declaration.
   * @param model
   */
  modelInstantiationReferenceContext(model: Model, name: string | undefined): Context {
    return {};
  }

  /**
   * Emit a model's properties. Unless overridden, this method will emit each of
   * the model's properties and return a no emit result.
   *
   * @param model
   */
  modelProperties(model: Model): EmitterOutput<T> {
    for (const prop of model.properties.values()) {
      this.emitter.emitModelProperty(prop);
    }
    return this.emitter.result.none();
  }

  /** Add lexical values for the property-list callback and the model members it emits. */
  modelPropertiesContext(model: Model): Context {
    return {};
  }

  /** Add values carried from the property list into members and their referenced types. */
  modelPropertiesReferenceContext(model: Model): Context {
    return {};
  }

  /**
   * Emit a property of a model.
   *
   * @param property
   */
  modelPropertyLiteral(property: ModelProperty): EmitterOutput<T> {
    this.emitter.emitTypeReference(property.type);
    return this.emitter.result.none();
  }

  /**
   * Set lexical context for a property of a model.
   *
   * @param property
   */
  modelPropertyLiteralContext(property: ModelProperty): Context {
    return {};
  }

  /**
   * Set reference context for a property of a model.
   *
   * @param property
   */
  modelPropertyLiteralReferenceContext(property: ModelProperty): Context {
    return {};
  }

  /**
   * Emit a model property reference (e.g. as created by the `SomeModel.prop`
   * syntax in TypeSpec). By default, this will emit the type of the referenced
   * property and return that result. In other words, the emit will look as if
   * `SomeModel.prop` were replaced with the type of `prop`.
   *
   * @param property
   */
  modelPropertyReference(property: ModelProperty): EmitterOutput<T> {
    return this.emitter.emitTypeReference(property.type);
  }

  /**
   * Emit an enum member reference (e.g. as created by the `SomeEnum.member` syntax
   * in TypeSpec). By default, this will emit nothing.
   *
   * @param property the enum member
   */
  enumMemberReference(member: EnumMember): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /**
   * Emit a named model with an integer indexer, such as `model Names is Array<string>`.
   * By default, visits the element type directly and returns no output.
   * `name` is supplied by `declarationName`; `elementType` is the indexer's value type.
   */
  arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<T> {
    this.emitter.emitType(array.indexer!.value);
    return this.emitter.result.none();
  }

  /** Establish lexical values for a named array in its own declaration context. */
  arrayDeclarationContext(array: Model, name: string, elementType: Type): Context {
    return {};
  }

  /** Add context carried into a named array's contents and references. */
  arrayDeclarationReferenceContext(array: Model, name: string, elementType: Type): Context {
    return {};
  }

  /**
   * Emit an inline array such as `string[]`, with the element type passed separately.
   * Unlike `arrayDeclaration`, the default neither visits the element nor emits output.
   */
  arrayLiteral(array: Model, elementType: Type): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for an inline array without leaving its surrounding declaration scope. */
  arrayLiteralContext(array: Model, elementType: Type): Context {
    return {};
  }

  /** Add context carried into types referenced while emitting an inline array. */
  arrayLiteralReferenceContext(array: Model, elementType: Type): Context {
    return {};
  }

  /** Emit a named scalar; by default, visits its base scalar, if any, then returns no output. */
  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<T> {
    if (scalar.baseScalar) {
      this.emitter.emitType(scalar.baseScalar);
    }
    return this.emitter.result.none();
  }

  /** Establish lexical values for a scalar declaration, using its computed output name. */
  scalarDeclarationContext(scalar: Scalar, name: string): Context {
    return {};
  }

  /** Add context carried into types reached while emitting a scalar declaration. */
  scalarDeclarationReferenceContext(scalar: Scalar, name: string): Context {
    return {};
  }

  /**
   * Emit a scalar with template arguments; the computed name may be undefined.
   * The default returns no output and does not visit a base scalar.
   */
  scalarInstantiation(scalar: Scalar, name: string | undefined): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Establish lexical values for a scalar instantiation before its emit callback runs. */
  scalarInstantiationContext(scalar: Scalar, name: string | undefined): Context {
    return {};
  }

  /** Handle compiler intrinsic types such as `unknown`, `void`, and `never`; emits nothing by default. */
  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for an intrinsic type without establishing a new declaration scope. */
  intrinsicContext(intrinsic: IntrinsicType, name: string): Context {
    return {};
  }

  /** Add lexical values for one boolean literal within the enclosing emit context. */
  booleanLiteralContext(boolean: BooleanLiteral): Context {
    return {};
  }

  /** Convert a boolean literal to output; the default returns no output rather than its textual value. */
  booleanLiteral(boolean: BooleanLiteral): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for a string template before its output is computed. */
  stringTemplateContext(string: StringTemplate): Context {
    return {};
  }

  /** Handle a string template; the default emits nothing and does not traverse its spans. */
  stringTemplate(stringTemplate: StringTemplate): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for a string literal, retaining the surrounding declaration context. */
  stringLiteralContext(string: StringLiteral): Context {
    return {};
  }

  /** Convert a string literal to output; quoting and escaping are left to overrides. Emits nothing by default. */
  stringLiteral(string: StringLiteral): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for a numeric literal within the enclosing emit context. */
  numericLiteralContext(number: NumericLiteral): Context {
    return {};
  }

  /** Convert a numeric literal to output; the default returns no output rather than formatting the number. */
  numericLiteral(number: NumericLiteral): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Emit a standalone operation; by default, visits parameters then return type and returns no output. */
  operationDeclaration(operation: Operation, name: string): EmitterOutput<T> {
    this.emitter.emitOperationParameters(operation);
    this.emitter.emitOperationReturnType(operation);

    return this.emitter.result.none();
  }

  /** Establish lexical values for a standalone operation and the signature parts it emits. */
  operationDeclarationContext(operation: Operation, name: string): Context {
    return {};
  }

  /** Add context carried from a standalone operation into its signature's referenced types. */
  operationDeclarationReferenceContext(operation: Operation, name: string): Context {
    return {};
  }

  /** Add lexical values for an interface's operation-list callback and its member operations. */
  interfaceDeclarationOperationsContext(iface: Interface): Context {
    return {};
  }

  /** Add context carried through the operation list into member signatures and their references. */
  interfaceDeclarationOperationsReferenceContext(iface: Interface): Context {
    return {};
  }

  /** Add lexical values for an operation emitted as an interface member, using its computed name. */
  interfaceOperationDeclarationContext(operation: Operation, name: string): Context {
    return {};
  }

  /** Add context carried from an interface operation into types referenced by its signature. */
  interfaceOperationDeclarationReferenceContext(operation: Operation, name: string): Context {
    return {};
  }

  /**
   * Handle the parameter model separately from the operation's return type.
   * The default emits nothing; override to traverse or render the parameter properties.
   */
  operationParameters(operation: Operation, parameters: Model): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for a parameter list and any children emitted by its callback. */
  operationParametersContext(operation: Operation, parameters: Model): Context {
    return {};
  }

  /** Add context carried into parameter types without applying it to the operation's return-type callback. */
  operationParametersReferenceContext(operation: Operation, parameters: Model): Context {
    return {};
  }

  /** Handle the return type separately from parameters; the default does not traverse it and emits nothing. */
  operationReturnType(operation: Operation, returnType: Type): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for a return-type callback and any children it emits. */
  operationReturnTypeContext(operation: Operation, returnType: Type): Context {
    return {};
  }

  /** Add context carried into return-type references without applying it to the parameter-list callback. */
  operationReturnTypeReferenceContext(operation: Operation, returnType: Type): Context {
    return {};
  }

  /** Emit a named interface; by default, visits its operation list and returns no output. */
  interfaceDeclaration(iface: Interface, name: string): EmitterOutput<T> {
    this.emitter.emitInterfaceOperations(iface);
    return this.emitter.result.none();
  }

  /** Establish lexical values for an interface declaration using its computed output name. */
  interfaceDeclarationContext(iface: Interface, name: string): Context {
    return {};
  }

  /** Add context carried into the interface's members and any types they reference. */
  interfaceDeclarationReferenceContext(iface: Interface, name: string): Context {
    return {};
  }

  /** Visit interface operations in map iteration order as members, discarding their outputs by default. */
  interfaceDeclarationOperations(iface: Interface): EmitterOutput<T> {
    for (const op of iface.operations.values()) {
      this.emitter.emitInterfaceOperation(op);
    }
    return this.emitter.result.none();
  }

  /** Emit an interface member's parameters then return type; the default returns no output. */
  interfaceOperationDeclaration(operation: Operation, name: string): EmitterOutput<T> {
    this.emitter.emitOperationParameters(operation);
    this.emitter.emitOperationReturnType(operation);

    return this.emitter.result.none();
  }

  /** Emit a named enum; by default, visits its member-list callback and returns no output. */
  enumDeclaration(en: Enum, name: string): EmitterOutput<T> {
    this.emitter.emitEnumMembers(en);
    return this.emitter.result.none();
  }

  /** Establish lexical values for an enum declaration and its members. */
  enumDeclarationContext(en: Enum, name: string): Context {
    return {};
  }

  /** Add reference-context values available while emitting an enum and its members. */
  enumDeclarationReferenceContext(en: Enum, name: string): Context {
    return {};
  }

  /** Visit enum members in map iteration order, discarding their outputs by default. */
  enumMembers(en: Enum): EmitterOutput<T> {
    for (const member of en.members.values()) {
      this.emitter.emitType(member);
    }
    return this.emitter.result.none();
  }

  /** Add lexical values for the enum's member-list callback and each member it visits. */
  enumMembersContext(en: Enum): Context {
    return {};
  }

  /** Handle an enum member within its declaration, not a reference to it; emits nothing by default. */
  enumMember(member: EnumMember): EmitterOutput<T> {
    return this.emitter.result.none();
  }

  /** Add lexical values for one enum member while retaining its enum's context. */
  enumMemberContext(member: EnumMember) {
    return {};
  }

  /** Emit a named union; by default, visits its variant list and returns no output. */
  unionDeclaration(union: Union, name: string): EmitterOutput<T> {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  /** Establish lexical values for a named union and the variants it emits. */
  unionDeclarationContext(union: Union): Context {
    return {};
  }

  /** Add context carried through a named union's variants into their referenced types. */
  unionDeclarationReferenceContext(union: Union): Context {
    return {};
  }

  /**
   * Emit a named union with template arguments; by default, visits its variants
   * and returns no output. The coordinator retains surrounding lexical context
   * when the computed declaration name is unavailable.
   */
  unionInstantiation(union: Union, name: string): EmitterOutput<T> {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  /** Add lexical values for an instantiated union before emitting its variants. */
  unionInstantiationContext(union: Union, name: string): Context {
    return {};
  }

  /** Add context carried through an instantiated union's variants and their references. */
  unionInstantiationReferenceContext(union: Union, name: string): Context {
    return {};
  }

  /** Emit an unnamed union expression; by default, visits its variants and returns no output. */
  unionLiteral(union: Union): EmitterOutput<T> {
    this.emitter.emitUnionVariants(union);
    return this.emitter.result.none();
  }

  /** Add lexical values for an inline union without leaving the surrounding declaration context. */
  unionLiteralContext(union: Union): Context {
    return {};
  }

  /** Add context carried from an inline union into its variants and their referenced types. */
  unionLiteralReferenceContext(union: Union): Context {
    return {};
  }

  /** Visit union variants in map iteration order, discarding their outputs by default. */
  unionVariants(union: Union): EmitterOutput<T> {
    for (const variant of union.variants.values()) {
      this.emitter.emitType(variant);
    }
    return this.emitter.result.none();
  }

  /** Add lexical values for the variant-list callback and the variants it emits. */
  unionVariantsContext(): Context {
    return {};
  }

  /** Add context carried from a variant list into each variant's referenced type. */
  unionVariantsReferenceContext(): Context {
    return {};
  }

  /** Visit a variant's type as a reference, then return no output by default. */
  unionVariant(variant: UnionVariant): EmitterOutput<T> {
    this.emitter.emitTypeReference(variant.type);
    return this.emitter.result.none();
  }
  /** Add lexical values for a single variant; the coordinator supplies the variant being visited. */
  unionVariantContext(union: Union): Context {
    return {};
  }

  /** Add context carried into the visited variant's referenced type. */
  unionVariantReferenceContext(union: Union): Context {
    return {};
  }

  /** Emit an inline tuple; by default, visits its value-list callback and returns no output. */
  tupleLiteral(tuple: Tuple): EmitterOutput<T> {
    this.emitter.emitTupleLiteralValues(tuple);
    return this.emitter.result.none();
  }

  /** Add lexical values for a tuple and its values within the enclosing declaration context. */
  tupleLiteralContext(tuple: Tuple): Context {
    return {};
  }

  /** Visit tuple values as references in positional order, discarding their outputs by default. */
  tupleLiteralValues(tuple: Tuple): EmitterOutput<T> {
    for (const value of tuple.values.values()) {
      this.emitter.emitTypeReference(value);
    }
    return this.emitter.result.none();
  }

  /** Add lexical values for the tuple's value-list callback and the values it emits. */
  tupleLiteralValuesContext(tuple: Tuple): Context {
    return {};
  }

  /** Add context carried through a tuple's value list into each referenced value type. */
  tupleLiteralValuesReferenceContext(tuple: Tuple): Context {
    return {};
  }

  /** Add context carried from an inline tuple into its values and their references. */
  tupleLiteralReferenceContext(tuple: Tuple): Context {
    return {};
  }

  /**
   * Serialize a populated file without writing it. By default, concatenates only
   * root-scope declaration values in registration order, each followed by a newline.
   * Overrides must render imports and nested scopes if their output requires them.
   */
  sourceFile(sourceFile: SourceFile<T>): Promise<EmittedSourceFile> | EmittedSourceFile {
    const emittedSourceFile: EmittedSourceFile = {
      path: sourceFile.path,
      contents: "",
    };

    for (const decl of sourceFile.globalScope.declarations) {
      emittedSourceFile.contents += decl.value + "\n";
    }

    return emittedSourceFile;
  }

  /**
   * Serialize and write files sequentially in the supplied order through the compiler host.
   * Called by the coordinator's `writeOutput`, not automatically after type traversal.
   */
  async writeOutput(sourceFiles: SourceFile<T>[]) {
    for (const file of sourceFiles) {
      const outputFile = await this.emitter.emitSourceFile(file);
      await emitFile(this.emitter.getProgram(), {
        path: outputFile.path,
        content: outputFile.contents,
      });
    }
  }

  /**
   * Construct a reference to a completed declaration; the default emits nothing.
   * Both paths are ordered outermost to innermost and exclude `commonScope`.
   * For different source files, the common scope is null and paths include file roots.
   * @param targetDeclaration - Named result being referenced.
   * @param pathUp - Scopes belonging only to the caller's chain, not traversal-step order.
   * @param pathDown - Scopes belonging only to the target's chain.
   * @param commonScope - Deepest scope shared by caller and target, or null.
   */
  reference(
    targetDeclaration: Declaration<T>,
    pathUp: Scope<T>[],
    pathDown: Scope<T>[],
    commonScope: Scope<T> | null,
  ): EmitEntity<T> | T {
    return this.emitter.result.none();
  }

  /**
   * Handle circular references. When this method is called it means we are resolving a circular reference.
   * The default rejects cycles with no declaration. Otherwise, a declaration target
   * is passed to {@link TypeEmitter.reference}, while an inline target is returned unchanged.
   * @param target Reference target.
   * @param scope Current scope.
   * @returns Resolved reference entity.
   */
  circularReference(
    target: EmitEntity<T>,
    scope: Scope<T> | undefined,
    cycle: ReferenceCycle,
  ): EmitEntity<T> | T {
    if (!cycle.containsDeclaration) {
      throw new Error(
        `Circular references to non-declarations are not supported by this emitter. Cycle:\n${cycle}`,
      );
    }
    if (target.kind !== "declaration") {
      return target;
    }
    compilerAssert(
      scope,
      "Emit context must have a scope set in order to create references to declarations.",
    );
    const { pathUp, pathDown, commonScope } = resolveDeclarationReferenceScope(target, scope);
    return this.reference(target, pathUp, pathDown, commonScope);
  }

  /**
   * Compute an output name, using the TypeSpec name for ordinary declarations.
   * For template instantiations, appends capitalized names of named type arguments;
   * returns undefined when an argument has no usable declaration name. Operations
   * in interfaces keep their own names rather than incorporating template arguments.
   * Override to apply output-language naming rules or choose which instantiations to inline.
   */
  declarationName(declarationType: TypeSpecDeclaration): string | undefined {
    compilerAssert(
      declarationType.name !== undefined,
      "Can't emit a declaration that doesn't have a name.",
    );

    if (declarationType.kind === "Enum" || declarationType.kind === "Intrinsic") {
      return declarationType.name;
    }

    // for operations inside interfaces, we don't want to do the fancy thing because it will make
    // operations inside instantiated interfaces get weird names
    if (declarationType.kind === "Operation" && declarationType.interface) {
      return declarationType.name;
    }

    if (!declarationType.templateMapper) {
      return declarationType.name;
    }

    let unspeakable = false;

    const parameterNames = declarationType.templateMapper.args.map((t) => {
      if (t.entityKind === "Indeterminate") {
        t = t.type;
      }
      if (!("kind" in t)) {
        return undefined;
      }
      switch (t.kind) {
        case "Model":
        case "Scalar":
        case "Interface":
        case "Operation":
        case "Enum":
        case "Union":
        case "Intrinsic":
          if (!t.name) {
            unspeakable = true;
            return undefined;
          }
          const declName = this.emitter.emitDeclarationName(t);
          if (declName === undefined) {
            unspeakable = true;
            return undefined;
          }
          return declName[0].toUpperCase() + declName.slice(1);
        default:
          unspeakable = true;
          return undefined;
      }
    });

    if (unspeakable) {
      return undefined;
    }

    return declarationType.name + parameterNames.join("");
  }
}

/**
 * A subclass of `TypeEmitter<string>` that makes working with strings a bit easier.
 * In particular, when emitting members of a type (`modelProperties`, `enumMembers`, etc.),
 * instead of returning no result, it returns the value of each of the members concatenated
 * by commas. It will also construct references by concatenating namespace elements together
 * with `.` which should work nicely in many object oriented languages.
 */
export class CodeTypeEmitter<TOptions extends object = Record<string, never>> extends TypeEmitter<
  string,
  TOptions
> {
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

  /** Join emitted interface operations with commas in map iteration order, preserving deferred values. */
  interfaceDeclarationOperations(iface: Interface): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const op of iface.operations.values()) {
      i++;
      builder.push(
        code`${this.emitter.emitInterfaceOperation(op)}${i < iface.operations.size ? "," : ""}`,
      );
    }
    return builder.reduce();
  }

  /** Join emitted enum members with commas in map iteration order, preserving deferred values. */
  enumMembers(en: Enum): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const enumMember of en.members.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(enumMember)}${i < en.members.size ? "," : ""}`);
    }
    return builder.reduce();
  }

  /** Join emitted union variants with commas in map iteration order, preserving deferred values. */
  unionVariants(union: Union): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const v of union.variants.values()) {
      i++;
      builder.push(code`${this.emitter.emitType(v)}${i < union.variants.size ? "," : ""}`);
    }
    return builder.reduce();
  }

  /** Join references to tuple values with commas in positional order, preserving deferred values. */
  tupleLiteralValues(tuple: Tuple): EmitterOutput<string> {
    const builder = new StringBuilder();
    let i = 0;
    for (const v of tuple.values) {
      i++;
      builder.push(code`${this.emitter.emitTypeReference(v)}${i < tuple.values.length ? "," : ""}`);
    }
    return builder.reduce();
  }

  /**
   * Qualify the declaration name with the names in `pathDown`, separated by dots.
   * Does not use `pathUp` or emit imports; override for other qualification rules.
   */
  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null,
  ): string | EmitEntity<string> {
    const basePath = pathDown.map((s) => s.name).join(".");
    return basePath
      ? this.emitter.result.rawCode(basePath + "." + targetDeclaration.name)
      : this.emitter.result.rawCode(targetDeclaration.name);
  }
}
