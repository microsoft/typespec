import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Enum,
  EnumMember,
  FunctionContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";

/**
 * Overrides the generated name for client SDK elements including clients, methods, parameters,
 * unions, models, enums, and model properties.
 *
 * This decorator takes precedence over all other naming mechanisms, including the `name`
 * property in `@client` decorator and default naming conventions.
 *
 * @param target The type you want to rename.
 * @param rename The rename you want applied to the object.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Rename a model
 * ```typespec
 * @clientName("RenamedModel")
 * model TestModel {
 *  prop: string;
 * }
 * ```
 * @example Rename a model property
 * ```typespec
 * model TestModel {
 *  @clientName("renamedProp")
 *  prop: string;
 * }
 * ```
 * @example Rename a parameter
 * ```typespec
 * op example(@clientName("renamedParameter") parameter: string): void;
 * ```
 * @example Rename an operation
 * ```typespec
 * @clientName("nameInClient")
 * op example(): void;
 * ```
 * @example Rename an operation for different language emitters
 * ```typespec
 * @clientName("nameForJava", "java")
 * @clientName("name_for_python", "python")
 * @clientName("nameForCsharp", "csharp")
 * @clientName("nameForJavascript", "javascript")
 * op example(): void;
 * ```
 */
export type ClientNameDecorator = (
  context: DecoratorContext,
  target: Type,
  rename: string,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Whether you want to generate an operation as a convenient method.
 * When applied to a namespace or interface, it affects all operations within that scope unless explicitly overridden.
 *
 * @param target The target operation, namespace, or interface.
 * @param flag Whether to generate the operation as a convenience method or not.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Apply to a single operation
 * ```typespec
 * @convenientAPI(false)
 * op test: void;
 * ```
 * @example Apply to all operations in an interface
 * ```typespec
 * @convenientAPI(false)
 * interface MyOperations {
 *   op test1(): void;
 *   op test2(): void;
 * }
 * ```
 * @example Apply to all operations in a namespace
 * ```typespec
 * @convenientAPI(false)
 * namespace MyService {
 *   op test1(): void;
 *   op test2(): void;
 * }
 * ```
 */
export type ConvenientAPIDecorator = (
  context: DecoratorContext,
  target: Operation | Namespace | Interface,
  flag?: boolean,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Whether you want to generate an operation as a protocol method.
 * When applied to a namespace or interface, it affects all operations within that scope unless explicitly overridden.
 *
 * @param target The target operation, namespace, or interface.
 * @param flag Whether to generate the operation as a protocol method or not.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Apply to a single operation
 * ```typespec
 * @protocolAPI(false)
 * op test: void;
 * ```
 * @example Apply to all operations in an interface
 * ```typespec
 * @protocolAPI(false)
 * interface MyOperations {
 *   op test1(): void;
 *   op test2(): void;
 * }
 * ```
 * @example Apply to all operations in a namespace
 * ```typespec
 * @protocolAPI(false)
 * namespace MyService {
 *   op test1(): void;
 *   op test2(): void;
 * }
 * ```
 */
export type ProtocolAPIDecorator = (
  context: DecoratorContext,
  target: Operation | Namespace | Interface,
  flag?: boolean,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Define the client generated in the client SDK.
 * If there is any `@client` definition or `@operationGroup` definition, then each `@client` is a root client and each `@operationGroup` is a sub client with hierarchy.
 * This decorator cannot be used along with `@clientLocation`. This decorator cannot be used as augmentation.
 *
 * @param target The target namespace or interface that you want to define as a client.
 * @param options Optional configuration for the service.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Basic client definition
 * ```typespec
 * namespace MyService {}
 *
 * @client({service: MyService})
 * interface MyInterface {}
 * ```
 * @example Changing client name
 * ```typespec
 * namespace MyService {}
 *
 * @client({service: MyService, name: "MySpecialClient"})
 * interface MyInterface {}
 * ```
 * @example
 *
 *
 */
export type ClientDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  options?: Type,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 *
 *
 *
 * @deprecated Use `@client` instead. The `@operationGroup` decorator is deprecated. Sub clients should be represented using `@client`.
 * Define the sub client generated in the client SDK.
 * If there is any `@client` definition or `@operationGroup` definition, then each `@client` is a root client and each `@operationGroup` is a sub client with hierarchy.
 * This decorator cannot be used along with `@clientLocation`. This decorator cannot be used as augmentation.
 * @param target The target namespace or interface that you want to define as a sub client.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example
 * ```typespec
 * @operationGroup
 * interface MyInterface{}
 * ```
 */
export type OperationGroupDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Add usage for models/enums.
 * A model/enum's default usage info is always calculated by the operations that use it.
 * You can use this decorator to add additional usage info.
 * When setting usage for namespaces,
 * the usage info will be propagated to the models defined in the namespace.
 * If the model has a usage override, the model override takes precedence.
 * For example, with operation definition `op test(): OutputModel`,
 * the model `OutputModel` has default usage `Usage.output`.
 * After adding decorator `@@usage(OutputModel, Usage.input | Usage.json)`,
 * the final usage result for `OutputModel` is `Usage.input | Usage.output | Usage.json`.
 * The usage info for models will be propagated to models' properties,
 * parent models, discriminated sub models.
 *
 * @param target The target type you want to extend usage.
 * @param value The usage info you want to add for this model. It can be a single value of `Usage` enum value or a combination of `Usage` enum values using bitwise OR.
 * For example, `Usage.input | Usage.output | Usage.json`.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Add usage for model
 * ```typespec
 * op test(): OutputModel;
 *
 * // The resolved usage  for `OutputModel` is `Usage.input | Usage.output | Usage.json`
 * @usage(Usage.input | Usage.json)
 * model OutputModel {
 *   prop: string
 * }
 * ```
 * @example Propagation of usage, all usage will be propagated to the parent model, discriminated sub models, and model properties.
 * ```typespec
 * // The resolved usage  for `Fish` is `Usage.input | Usage.output | Usage.json`
 * @discriminator("kind")
 * model Fish {
 *   age: int32;
 * }
 *
 * // The resolved usage  for `Shark` is `Usage.input | Usage.output | Usage.json`
 * @discriminator("sharktype")
 * @usage(Usage.input | Usage.json)
 * model Shark extends Fish {
 *   kind: "shark";
 *   origin: Origin;
 * }
 *
 * // The resolved usage  for `Salmon` is `Usage.output | Usage.json`
 * model Salmon extends Fish {
 *   kind: "salmon";
 * }
 *
 * // The resolved usage  for `SawShark` is `Usage.input | Usage.output | Usage.json`
 * model SawShark extends Shark {
 *   sharktype: "saw";
 * }
 *
 * // The resolved usage  for `Origin` is `Usage.input | Usage.output | Usage.json`
 * model Origin {
 *   country: string;
 *   city: string;
 *   manufacture: string;
 * }
 *
 * @get
 * op getModel(): Fish;
 * ```
 */
export type UsageDecorator = (
  context: DecoratorContext,
  target: Model | Enum | Union | Namespace,
  value: EnumMember | Union,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Override access for operations, models, enums and model properties.
 * When setting access for namespaces,
 * the access info will be propagated to the models and operations defined in the namespace.
 * If the model has an access override, the model override takes precedence.
 * When setting access for an operation,
 * it will influence the access info for models/enums that are used by this operation.
 * Models/enums that are used in any operations with `@access(Access.public)` will be set to access "public"
 * Models/enums that are only used in operations with `@access(Access.internal)` will be set to access "internal".
 * The access info for models will be propagated to models' properties,
 * parent models, discriminated sub models.
 * The override access should not be narrower than the access calculated by operation,
 * and different override access should not conflict with each other,
 * otherwise a warning will be added to the diagnostics list.
 * Model property's access will default to public unless there is an override.
 *
 * @param target The target type you want to override access info.
 * @param value The access info you want to set for this model or operation. It should be one of the `Access` enum values, either `Access.public` or `Access.internal`.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Set access
 * ```typespec
 * // Access.internal
 * @access(Access.internal)
 * model ModelToHide {
 *   prop: string;
 * }
 * // Access.internal
 * @access(Access.internal)
 * op test: void;
 * ```
 * @example Access propagation
 * ```typespec
 * // Access.internal
 * @discriminator("kind")
 * model Fish {
 *   age: int32;
 * }
 *
 * // Access.internal
 * @discriminator("sharktype")
 * model Shark extends Fish {
 *   kind: "shark";
 *   origin: Origin;
 * }
 *
 * // Access.internal
 * model Salmon extends Fish {
 *   kind: "salmon";
 * }
 *
 * // Access.internal
 * model SawShark extends Shark {
 *   sharktype: "saw";
 * }
 *
 * // Access.internal
 * model Origin {
 *   country: string;
 *   city: string;
 *   manufacture: string;
 * }
 *
 * // Access.internal
 * @get
 * @access(Access.internal)
 * op getModel(): Fish;
 * ```
 * @example Access influence from operation
 * ```typespec
 * // Access.internal
 * model Test1 {
 * }
 *
 * // Access.internal
 * @access(Access.internal)
 * @route("/func1")
 * op func1(
 *   @body body: Test1
 * ): void;
 *
 * // Access.public
 * model Test2 {
 * }
 *
 * // Access.public
 * @route("/func2")
 * op func2(
 *   @body body: Test2
 * ): void;
 *
 * // Access.public
 * model Test3 {
 * }
 *
 * // Access.public
 * @access(Access.public)
 * @route("/func3")
 * op func3(
 *   @body body: Test3
 * ): void;
 *
 * // Access.public
 * model Test4 {
 * }
 *
 * // Access.internal
 * @access(Access.internal)
 * @route("/func4")
 * op func4(
 *   @body body: Test4
 * ): void;
 *
 * // Access.public
 * @route("/func5")
 * op func5(
 *   @body body: Test4
 * ): void;
 *
 * // Access.public
 * model Test5 {
 * }
 *
 * // Access.internal
 * @access(Access.internal)
 * @route("/func6")
 * op func6(
 *   @body body: Test5
 * ): void;
 *
 * // Access.public
 * @route("/func7")
 * op func7(
 *   @body body: Test5
 * ): void;
 *
 * // Access.public
 * @access(Access.public)
 * @route("/func8")
 * op func8(
 *   @body body: Test5
 * ): void;
 * ```
 */
export type AccessDecorator = (
  context: DecoratorContext,
  target: ModelProperty | Model | Operation | Enum | Union | Namespace,
  value: EnumMember,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Customize a method's signature in the generated client SDK.
 * Currently, only parameter signature customization is supported.
 * This decorator allows you to specify a different method signature for the client SDK than the original definition.
 *
 * @param target : The target operation that you want to override.
 * @param override : The override method definition that specifies the exact client method you want
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Customize parameters into an option bag
 * ```typespec
 * // main.tsp
 * @service
 * namespace MyService;
 *
 * op myOperation(foo: string, bar: string): void; // by default, we generate the method signature as `op myOperation(foo: string, bar: string)`;
 *
 * // client.tsp
 * namespace MyCustomizations;
 *
 * model Params {
 *  foo: string;
 *  bar: string;
 * }
 *
 * op myOperationCustomization(params: MyService.Params): void;
 *
 * @@override(MyService.myOperation, myOperationCustomization); // method signature is now `op myOperation(params: Params)`
 * ```
 * @example Customize a parameter to be required
 * ```typespec
 * // main.tsp
 * @service
 * namespace MyService;
 *
 * op myOperation(foo: string, bar?: string): void; // by default, we generate the method signature as `op myOperation(foo: string, bar?: string)`;
 *
 * // client.tsp
 * namespace MyCustomizations;
 *
 * op myOperationCustomization(foo: string, bar: string): void;
 *
 * @@override(MyService.myOperation, myOperationCustomization)
 *
 * // method signature is now `op myOperation(params: Params)` just for csharp // method signature is now `op myOperation(foo: string, bar: string)`
 * ```
 */
export type OverrideDecorator = (
  context: DecoratorContext,
  target: Operation,
  override: Operation,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Whether a model needs the custom JSON converter, this is only used for backward compatibility for csharp.
 *
 * @param target The target model that you want to set the custom JSON converter.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example
 * ```typespec
 * @useSystemTextJsonConverter
 * model MyModel {
 *   prop: string;
 * }
 * ```
 */
export type UseSystemTextJsonConverterDecorator = (
  context: DecoratorContext,
  target: Model,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Allows customization of how clients are initialized in the generated SDK.
 * By default, the root client is initialized independently, while sub clients are initialized through their parent client.
 * Initialization parameters typically include endpoint, credential, and API version.
 * With `@clientInitialization` decorator, you can elevate operation level parameters to client level, and set how the client is initialized.
 * This decorator can be combined with `@paramAlias` decorator to change the parameter name in client initialization.
 *
 * @param target The target client that you want to customize client initialization for.
 * @param options The options for client initialization. You can use `ClientInitializationOptions` model to set the options.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Add client initialization parameters
 * ```typespec
 * // main.tsp
 * namespace MyService;
 *
 * op upload(blobName: string): void;
 * op download(blobName: string): void;
 *
 * // client.tsp
 * namespace MyCustomizations;
 * model MyServiceClientOptions {
 *   blobName: string;
 * }
 *
 * @@clientInitialization(MyService, {parameters: MyServiceClientOptions})
 * // The generated client will have `blobName` in its initialization method. We will also
 * // elevate the existing `blobName` parameter from method level to client level.
 * ```
 */
export type ClientInitializationDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  options: Type,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Alias the name of a client parameter to a different name. This permits you to have a different name for the parameter in client initialization and the original parameter in the operation.
 *
 * @param target The target model property that you want to alias.
 * @param paramAlias The alias name you want to apply to the target model property.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Elevate an operation parameter to client level and alias it to a different name
 * ```typespec
 * // main.tsp
 * namespace MyService;
 *
 * op upload(blobName: string): void;
 *
 * // client.tsp
 * namespace MyCustomizations;
 * model MyServiceClientOptions {
 *   blob: string;
 * }
 *
 * @@clientInitialization(MyService, MyServiceClientOptions)
 * @@paramAlias(MyServiceClientOptions.blob, "blobName")
 *
 * // The `blob` property from MyServiceClientOptions will be elevated to the client level.
 * // Because of @@paramAlias, it will be matched to the `blobName` operation parameter.
 * ```
 */
export type ParamAliasDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  paramAlias: string,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Changes the namespace of a client, model, enum or union generated in the client SDK.
 * By default, the client namespace for them will follow the TypeSpec namespace.
 *
 * @param target The type you want to change the namespace for.
 * @param rename The rename you want applied to the object
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Change a namespace to a different name
 * ```typespec
 * @clientNamespace("ContosoClient")
 * namespace Contoso;
 * ```
 * @example Move a model to a different namespace
 * ```typespec
 * @clientNamespace("ContosoClient.Models")
 * model Test {
 *  prop: string;
 * }
 * ```
 */
export type ClientNamespaceDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Model | Enum | Union,
  rename: string,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Set an alternate type for a model property, Scalar, Model, Enum, Union, or function parameter. Note that `@encode` will be overridden by the one defined in the alternate type.
 * When the source type is `Scalar`, the alternate type must be `Scalar`.
 * The replaced type could be a type defined in the TypeSpec or an external type declared by type identity, package that export the type and package version.
 * **Important:** External types (with `identity` property) cannot be applied to model properties. They must be applied to the type definition itself (Scalar, Model, Enum, or Union).
 *
 * @param target The source type to which the alternate type will be applied.
 * @param alternate The alternate type to apply to the target. Can be a TypeSpec type or an ExternalType.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Change a model property to a different type
 * ```typespec
 * model Foo {
 *    date: utcDateTime;
 * }
 * @@alternateType(Foo.date, string);
 * ```
 * @example Change a Scalar type to a different type
 * ```typespec
 * scalar storageDateTime extends utcDateTime;
 * @@alternateType(storageDateTime, string, "python");
 * ```
 * @example Change a function parameter to a different type
 * ```typespec
 * op test(@param @alternateType(string) date: utcDateTime): void;
 * ```
 * @example Change a model property to a different type with language specific alternate type
 * ```typespec
 * model Test {
 *   @alternateType(unknown)
 *   thumbprint?: string;
 *
 *   @alternateType(AzureLocation[], "csharp")
 *   locations: string[];
 * }
 * ```
 * @example Use external type for DFE case
 * ```typespec
 * @alternateType({
 *   identity: "Azure.Core.Expressions.DataFactoryExpression",
 * }, "csharp")
 * union Dfe<T> {
 *   T,
 *   DfeExpression
 * }
 * ```
 * @example Use external type with package information
 * ```typespec
 * @alternateType({
 *   identity: "pystac.Collection",
 *   package: "pystac",
 *   minVersion: "1.13.0",
 * }, "python")
 * model ItemCollection {
 *   // ... properties
 * }
 * ```
 * @example Invalid: External type on model property (will emit a warning)
 * ```typespec
 * model MyModel {
 *   field: FieldType;
 * }
 * // This will emit a warning - external types cannot be applied to properties
 * @@alternateType(MyModel.field, {
 *   identity: "ExternalType",
 * }, "rust");
 *
 * // Correct: Apply external type to the type definition instead
 * @alternateType({
 *   identity: "ExternalType",
 * }, "rust")
 * model FieldType {
 *   // ... properties
 * }
 * ```
 */
export type AlternateTypeDecorator = (
  context: DecoratorContext,
  target: ModelProperty | Scalar | Model | Enum | Union,
  alternate: Type,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Define the scope of an operation or model property.
 * By default, the element will be applied to all language emitters.
 * This decorator allows you to omit the element from certain languages or apply it to specific languages.
 * When applied to an operation parameter (which is a `ModelProperty`), the parameter will be excluded
 * from the generated method signature for the specified languages. A warning is emitted if a required
 * parameter is scoped out.
 *
 * @param target The target operation or model property that you want to scope.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Omit an operation from a specific language
 * ```typespec
 * @scope("!csharp")
 * op test: void;
 * ```
 * @example Apply an operation to specific languages
 * ```typespec
 * @scope("go")
 * op test: void;
 * ```
 * @example Apply a model property to specific languages
 * ```typespec
 * model TestModel {
 *   @scope("csharp")
 *   csharpOnlyProp: string;
 * }
 * ```
 * @example Exclude an operation parameter from a specific language
 * ```typespec
 * op test(
 *   name: string,
 *   @header("X-Custom-Header") @scope("!python") customHeader?: string,
 * ): void;
 * ```
 */
export type ScopeDecorator = (
  context: DecoratorContext,
  target: Operation | ModelProperty,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify whether a parameter is an API version parameter or not.
 * By default, we detect an API version parameter by matching the parameter name with `api-version` or `apiversion`, or if the type is referenced by the `@versioned` decorator.
 * Since API versions are a client parameter, we will also elevate this parameter up onto the client.
 * This decorator allows you to explicitly specify whether a parameter should be treated as an API version parameter or not.
 *
 * @param target The target parameter that you want to mark as an API version parameter.
 * @param value If true, we will treat this parameter as an api-version parameter. If false, we will not. Default is true.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Mark a parameter as an API version parameter
 * ```typespec
 * namespace Contoso;
 *
 * op test(
 *   @apiVersion
 *   @header("x-ms-version")
 *   version: string
 * ): void;
 * ```
 * @example Mark a parameter as not presenting an API version parameter
 * ```typespec
 * namespace Contoso;
 * op test(
 *   @apiVersion(false)
 *   @query
 *   api-version: string
 * ): void;
 * ```
 */
export type ApiVersionDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  value?: boolean,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify additional API versions that the client can support. These versions should include those defined by the service's versioning configuration.
 * This decorator is useful for extending the API version enum exposed by the client.
 * It is particularly beneficial when generating a complete API version enum without requiring the entire specification to be annotated with versioning decorators, as the generation process does not depend on versioning details.
 *
 * @param target The target client for which you want to define additional API versions.
 * @param value An enum defining the complete set of API versions the client should support, including both service-defined and additional versions.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Add additional API versions to a client
 * ```typespec
 * // main.tsp
 * @versioned(Versions)
 * namespace Contoso {
 *  enum Versions { v4, v5 }
 * }
 *
 * // client.tsp
 *
 * enum ClientApiVersions { v1, v2, v3, ...Contoso.Versions }
 *
 * @@clientApiVersions(Contoso, ClientApiVersions)
 * ```
 */
export type ClientApiVersionsDecorator = (
  context: DecoratorContext,
  target: Namespace,
  value: Enum,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Indicates that a model property of type `string` or a `Scalar` type derived from `string` should be deserialized as `null` when its value is an empty string (`""`).
 *
 * @param target The target type that you want to apply this deserialization behavior to.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example
 * ```typespec
 *
 * model MyModel {
 *   scalar stringlike extends string;
 *
 *   @deserializeEmptyStringAsNull
 *   prop: string;
 *
 *   @deserializeEmptyStringAsNull
 *   prop: stringlike;
 * }
 * ```
 */
export type DeserializeEmptyStringAsNullDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Indicates that a HEAD operation should be modeled as Response<bool>.
 * 404 will not raise an error, instead the service method will return `false`.
 * 2xx will return `true`. Everything else will still raise an error.
 *
 * @param target The target operation that you want to apply this behavior to.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example
 * ```typespec
 * @responseAsBool
 * @head
 * op headOperation(): void;
 * ```
 */
export type ResponseAsBoolDecorator = (
  context: DecoratorContext,
  target: Operation,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Change the operation location in the client. If the target client is not defined, use `string` to indicate a new client name. For this usage, the decorator cannot be used along with `@client` or `@operationGroup` decorators.
 * Change the parameter location to operation or client. For this usage, the decorator cannot be used in the parameter defined in  `@clientInitialization` decorator.
 *
 * @param source The operation to change location for.
 * @param target The target `Namespace`, `Interface` or a string which can indicate the client.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Move to existing sub client
 * ```typespec
 * @service
 * namespace MoveToExistingSubClient;
 *
 * interface UserOperations {
 *   @route("/user")
 *   @get
 *   getUser(): void;
 *
 *   @route("/user")
 *   @delete
 *   @clientLocation(AdminOperations)
 *   deleteUser(): void; // This operation will be moved to AdminOperations sub client.
 * }
 *
 * interface AdminOperations {
 *   @route("/admin")
 *   @get
 *   getAdminInfo(): void;
 * }
 * ```
 * @example Move to new sub client
 * ```typespec
 * @service
 * namespace MoveToNewSubClient;
 *
 * interface ProductOperations {
 *   @route("/products")
 *   @get
 *   listProducts(): void;
 *
 *   @route("/products/archive")
 *   @post
 *   @clientLocation("ArchiveOperations")
 *   archiveProduct(): void; // This operation will be moved to a new sub client named ArchiveOperations.
 * }
 * ```
 * @example Move operation to root client
 * ```typespec
 * @service
 * namespace MoveToRootClient;
 *
 * interface ResourceOperations {
 *   @route("/resource")
 *   @get
 *   getResource(): void;
 *
 *   @route("/health")
 *   @get
 *   @clientLocation(MoveToRootClient)
 *   getHealthStatus(): void; // This operation will be moved to the root client of MoveToRootClient namespace.
 * }
 *
 * ```
 * @example Move parameter from operation to client
 * ```typespec
 * @service
 * namespace MyClient;
 *
 * getHealthStatus(
 *   @clientLocation(MyClient) // This parameter will be moved to the `.clientInitialization` parameters of `MyClient`. It will not appear on the operation-level.
 *   clientId: string
 * ): void;
 * ```
 * @example Move parameter from client to operation
 * ```typespec
 * // client.tsp
 *
 * @@clientLocation(CommonTypes.SubscriptionIdParameter.subscriptionId, get); // This will keep the `subscriptionId` parameter on the operation level instead of applying TCGC's default logic of elevating `subscriptionId` to client.
 * ```
 */
export type ClientLocationDecorator = (
  context: DecoratorContext,
  source: Operation | ModelProperty,
  target: Interface | Namespace | Operation | string,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Override documentation for a type in client libraries. This allows you to
 * provide client-specific documentation that differs from the original documentation.
 *
 * @param target The target type (operation, model, enum, etc.) for which you want to apply client-specific documentation.
 * @param documentation The client-specific documentation to apply
 * @param mode Specifies how to apply the documentation (append or replace)
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Replacing documentation
 * ```typespec
 * @doc("This is service documentation")
 * @clientDoc("This is client-specific documentation", DocumentationMode.replace)
 * op myOperation(): void;
 * ```
 * @example Appending documentation
 * ```typespec
 * @doc("This is service documentation.")
 * @clientDoc("This additional note is for client libraries only.", DocumentationMode.append)
 * model MyModel {
 *   prop: string;
 * }
 * ```
 * @example Language-specific documentation
 * ```typespec
 * @doc("This is service documentation")
 * @clientDoc("Python-specific documentation", DocumentationMode.replace, "python")
 * @clientDoc("JavaScript-specific documentation", DocumentationMode.replace, "javascript")
 * op myOperation(): void;
 * ```
 */
export type ClientDocDecorator = (
  context: DecoratorContext,
  target: Type,
  documentation: string,
  mode: EnumMember,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Pass experimental flags or options to emitters without requiring TCGC reshipping.
 * This decorator is intended for temporary workarounds or experimental features and requires
 * suppression to acknowledge its experimental nature.
 *
 * See supported client options for each language emitter here https://azure.github.io/typespec-azure/docs/howtos/generate-client-libraries/12clientOptions/
 *
 * **Warning**: This decorator always emits a warning that must be suppressed, and an additional
 * warning if no scope is provided (since options are typically language-specific).
 *
 * @param target The type you want to apply the option to.
 * @param name The name of the option (e.g., "enableFeatureFoo").
 * @param value The value of the option. Can be any type; emitters will cast as needed.
 * @param scope Specifies the target language emitters that the decorator should apply. If not set, the decorator will be applied to all language emitters by default.
 *
 * **Supported language identifiers:** `csharp`, `python`, `java`, `javascript`, `go`, and other language emitter names (derived from the emitter package name, e.g., `@azure-tools/typespec-csharp` → `csharp`).
 *
 * **Valid patterns:**
 * - Single language: `"python"`
 * - Multiple languages (comma-separated): `"python, java"`
 * - Negation to exclude languages: `"!csharp"` or `"!(java, python)"`
 * @example Apply an experimental option for Python
 * ```typespec
 * #suppress "@azure-tools/typespec-client-generator-core/client-option" "preview feature for python"
 * @clientOption("enableFeatureFoo", true, "python")
 * model MyModel {
 *   prop: string;
 * }
 * ```
 */
export type ClientOptionDecorator = (
  context: DecoratorContext,
  target: Type,
  name: string,
  value: unknown,
  scope?: string,
) => DecoratorValidatorCallbacks | void;

export type AzureClientGeneratorCoreDecorators = {
  clientName: ClientNameDecorator;
  convenientAPI: ConvenientAPIDecorator;
  protocolAPI: ProtocolAPIDecorator;
  client: ClientDecorator;
  operationGroup: OperationGroupDecorator;
  usage: UsageDecorator;
  access: AccessDecorator;
  override: OverrideDecorator;
  useSystemTextJsonConverter: UseSystemTextJsonConverterDecorator;
  clientInitialization: ClientInitializationDecorator;
  paramAlias: ParamAliasDecorator;
  clientNamespace: ClientNamespaceDecorator;
  alternateType: AlternateTypeDecorator;
  scope: ScopeDecorator;
  apiVersion: ApiVersionDecorator;
  clientApiVersions: ClientApiVersionsDecorator;
  deserializeEmptyStringAsNull: DeserializeEmptyStringAsNullDecorator;
  responseAsBool: ResponseAsBoolDecorator;
  clientLocation: ClientLocationDecorator;
  clientDoc: ClientDocDecorator;
  clientOption: ClientOptionDecorator;
};

/**
 * Replace a parameter in an operation with a new parameter definition.
 * This function creates a new operation with the specified parameter replaced,
 * enabling composable transformations without mutating the original operation.
 *
 * @param operation The operation to transform.
 * @param selector The parameter to replace, specified either by name (string) or by direct reference (ModelProperty).
 * @param replacement The replacement parameter.
 * @returns A new operation with the parameter replaced.
 * @example Making an optional parameter required
 * ```typespec
 * model RequiredMaxResults {
 *   maxResults: int32;
 * }
 *
 * @@override(KeyVault.getSecrets, replaceParameter(KeyVault.getSecrets, "maxResults", RequiredMaxResults.maxResults));
 * ```
 * @example Chaining transformations
 * ```typespec
 * alias Step1 = replaceParameter(MyService.myOp, "oldParam", NewParams.newParam);
 * @@override(MyService.myOp, replaceParameter(Step1, "anotherParam", NewParams.anotherParam));
 * ```
 */
export type ReplaceParameterFunctionImplementation = (
  context: FunctionContext,
  operation: Operation,
  selector: string | unknown,
  replacement: ModelProperty,
) => Operation;

/**
 * Remove a parameter from an operation.
 * This function creates a new operation with the specified parameter removed,
 * enabling composable transformations without mutating the original operation.
 *
 * Note: When used with `@@override`, only optional parameters can be removed. Attempting to
 * remove a required parameter will result in an `override-parameters-mismatch` error.
 *
 * @param operation The operation to transform.
 * @param selector The parameter to remove, specified either by name (string) or by direct reference (ModelProperty).
 * @returns A new operation with the parameter removed.
 * @example Removing an optional parameter
 * ```typespec
 * @@override(KeyVault.getSecrets, removeParameter(KeyVault.getSecrets, "maxResults"));
 * ```
 * @example Chaining with other transformations
 * ```typespec
 * alias Step1 = removeParameter(MyService.myOp, "unwantedParam");
 * @@override(MyService.myOp, addParameter(Step1, NewParams.newParam));
 * ```
 */
export type RemoveParameterFunctionImplementation = (
  context: FunctionContext,
  operation: Operation,
  selector: string | unknown,
) => Operation;

/**
 * Add a new parameter to an operation.
 * This function creates a new operation with the additional parameter appended,
 * enabling composable transformations without mutating the original operation.
 *
 * @param operation The operation to transform.
 * @param parameter The parameter to add to the operation.
 * @returns A new operation with the parameter added.
 * @example Adding a required parameter
 * ```typespec
 * model ExtraParams {
 *   @header tracingId: string;
 * }
 *
 * @@override(MyService.myOp, addParameter(MyService.myOp, ExtraParams.tracingId));
 * ```
 * @example Chaining with replaceParameter
 * ```typespec
 * model NewParams {
 *   oldParam: string;  // make required
 *   newParam: int32;
 * }
 *
 * alias Step1 = replaceParameter(MyService.myOp, "oldParam", NewParams.oldParam);
 * @@override(MyService.myOp, addParameter(Step1, NewParams.newParam));
 * ```
 */
export type AddParameterFunctionImplementation = (
  context: FunctionContext,
  operation: Operation,
  parameter: ModelProperty,
) => Operation;

/**
 * Reorder parameters of an operation according to the specified order.
 * This function creates a new operation with parameters reordered as specified,
 * enabling control over the parameter order in generated client SDK methods.
 *
 * @param operation The operation to transform.
 * @param order An array of parameter names specifying the desired order. All parameters must be included.
 * @returns A new operation with parameters reordered.
 * @example Reordering parameters
 * ```typespec
 * @service
 * namespace MyService;
 *
 * op myOp(a: string, b: string, c: string): void;
 *
 * // Reorder to put 'c' first, then 'a', then 'b'
 * @@override(MyService.myOp, reorderParameters(MyService.myOp, #["c", "a", "b"]));
 * ```
 * @example Chaining with other transformations
 * ```typespec
 * alias Step1 = addParameter(MyService.myOp, NewParams.newParam);
 * @@override(MyService.myOp, reorderParameters(Step1, #["newParam", "existingParam"]));
 * ```
 */
export type ReorderParametersFunctionImplementation = (
  context: FunctionContext,
  operation: Operation,
  order: readonly string[],
) => Operation;

export type AzureClientGeneratorCoreFunctions = {
  replaceParameter: ReplaceParameterFunctionImplementation;
  removeParameter: RemoveParameterFunctionImplementation;
  addParameter: AddParameterFunctionImplementation;
  reorderParameters: ReorderParametersFunctionImplementation;
};
