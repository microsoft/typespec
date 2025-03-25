export { resolveCompilerOptions, ResolveCompilerOptionsOptions } from "./config/index.js";
export {
  Checker,
  CreateTypeProps,
  // TODO: feels like all of those should move to a separate file
  filterModelProperties,
  getEffectiveModelType,
  walkPropertiesInherited,
} from "./core/checker.js";
export {
  getPropertyType,
  isTypeSpecValueTypeOf,
  typespecTypeToJson,
  validateDecoratorNotOnType,
  // TODO: decide what to do with those, dec should use extern dec instead
  // if we remove, remove from decorator-utils too
  // validateDecoratorParamCount,
  // validateDecoratorTarget,
  validateDecoratorUniqueOnNode,
  type DecoratorDefinition,
  type DecoratorParamDefinition,
  type DecoratorValidator,
  type InferredTypeSpecValue,
  type TypeKind,
  type TypeSpecValue,
} from "./core/decorator-utils.js";
export {
  getDeprecationDetails,
  isDeprecated,
  markDeprecated,
  type DeprecationDetails,
} from "./core/deprecation.js";
export {
  assertType,
  compilerAssert,
  createDiagnosticCollector,
  defineCodeFix,
  formatDiagnostic,
  getSourceLocation,
  ignoreDiagnostics,
  logDiagnostics,
  reportDeprecated,
  type DiagnosticCollector,
  type DiagnosticHandler,
  type SourceLocationOptions,
  type WriteLine,
} from "./core/diagnostics.js";
export { emitFile, type EmitFileOptions, type NewLine } from "./core/emitter-utils.js";
export { checkFormatTypeSpec, formatTypeSpec } from "./core/formatter.js";
export {
  DiscriminatedUnion,
  DiscriminatedUnionLegacy,
  explainStringTemplateNotSerializable,
  printIdentifier as formatIdentifier,
  getDiscriminatedUnion,
  getDiscriminatedUnionFromInheritance,
  getEntityName,
  getLocationContext,
  getNamespaceFullName,
  getTypeName,
  interpolatePath,
  isStdNamespace,
  listOperationsIn,
  printIdentifier,
  resolveUsages,
  TypeNameOptions,
  UsageFlags,
  type ListOperationOptions,
  type OperationContainer,
  type TrackableType,
  type UsageTracker,
} from "./core/helpers/index.js";
export {
  getDiscriminatedTypes,
  getDiscriminator,
  getDocData,
  getMaxItems,
  getMaxItemsAsNumeric,
  getMaxLength,
  getMaxLengthAsNumeric,
  getMaxValue,
  getMaxValueAsNumeric,
  getMaxValueExclusive,
  getMaxValueExclusiveAsNumeric,
  getMinItems,
  getMinItemsAsNumeric,
  getMinLength,
  getMinLengthAsNumeric,
  getMinValue,
  getMinValueAsNumeric,
  getMinValueExclusive,
  getMinValueExclusiveAsNumeric,
  type Discriminator,
} from "./core/intrinsic-type-state.js";
export {
  createLinterRule as createRule,
  createTypeSpecLibrary,
  defineLinter,
  definePackageFlags,
  paramMessage,
  setTypeSpecNamespace,
} from "./core/library.js";
export { resolveLinterDefinition } from "./core/linter.js";
export { NodeHost } from "./core/node-host.js";
export { isNumeric, Numeric } from "./core/numeric.js";
export type { CompilerOptions } from "./core/options.js";
export { getPositionBeforeTrivia } from "./core/parser-utils.js";
export {
  $defaultVisibility,
  $discriminator,
  $doc,
  $encode,
  $encodedName,
  $error,
  $errorsDoc,
  $example,
  $format,
  $friendlyName,
  $inspectType,
  $inspectTypeName,
  $invisible,
  $key,
  $maxItems,
  $maxLength,
  $maxValue,
  $maxValueExclusive,
  $minItems,
  $minLength,
  $minValue,
  $minValueExclusive,
  $opExample,
  $overload,
  $parameterVisibility,
  $pattern,
  $removeVisibility,
  $returnsDoc,
  $returnTypeVisibility,
  $secret,
  $service,
  $summary,
  $tag,
  $visibility,
  $withDefaultKeyVisibility,
  $withLifecycleUpdate,
  $withOptionalProperties,
  $withoutDefaultValues,
  $withoutOmittedProperties,
  $withPickedProperties,
  $withUpdateableProperties,
  $withVisibility,
  $withVisibilityFilter,
  addService,
  discriminatedDecorator,
  EmptyVisibilityProvider,
  getAllTags,
  getDeprecated,
  getDoc,
  getEncode,
  getErrorsDoc,
  getErrorsDocData,
  getExamples,
  getFormat,
  getFriendlyName,
  getKeyName,
  getMediaTypeHint,
  getOpExamples,
  getOverloadedOperation,
  getOverloads,
  getPagingOperation,
  getParameterVisibilityFilter,
  getPattern,
  getPatternData,
  getReturnsDoc,
  getReturnsDocData,
  getReturnTypeVisibilityFilter,
  getService,
  getSummary,
  getTags,
  isErrorModel,
  isKey,
  isList,
  isNumericType,
  isSecret,
  isService,
  isStringType,
  listServices,
  PagingOperation,
  PagingProperty,
  PatternData,
  resolveEncodedName,
  serializeValueAsJson,
  Service,
  ServiceDetails,
  VisibilityProvider,
  type BytesKnownEncoding,
  type DateTimeKnownEncoding,
  type DurationKnownEncoding,
  type EncodeData,
  type Example,
  type ExampleOptions,
  type OpExample,
} from "./lib/decorators.js";
export { MANIFEST, type TypeSpecManifest } from "./manifest.js";
export {
  resolveModule,
  type ModuleResolutionResult,
  type ResolveModuleHost,
  type ResolveModuleOptions,
} from "./module-resolver/module-resolver.js";
export {
  CompileResult,
  createServer,
  TypeSpecLanguageConfiguration,
  type CustomRequestName,
  type InitProjectConfig,
  type InitProjectContext,
  type InitProjectTemplate,
  type InitProjectTemplateEmitterTemplate,
  type InitProjectTemplateLibrarySpec,
  type SemanticToken,
  type SemanticTokenKind,
  type Server,
  type ServerCustomCapacities,
  type ServerHost,
  type ServerInitializeResult,
  type ServerLog,
  type ServerLogLevel,
  type ServerSourceFile,
  type ServerWorkspaceFolder,
} from "./server/index.js";
export type { PackageJson } from "./types/package-json.js";

import { $decorators as intrinsicDecorators } from "./lib/intrinsic/tsp-index.js";
import { $decorators as stdDecorators } from "./lib/tsp-index.js";
/** @internal for Typespec compiler */
export const $decorators = {
  TypeSpec: {
    ...stdDecorators.TypeSpec,
  },
  "TypeSpec.Prototypes": {
    ...intrinsicDecorators["TypeSpec.Prototypes"],
  },
};

export {
  ensureTrailingDirectorySeparator,
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  getNormalizedAbsolutePath,
  getNormalizedAbsolutePathWithoutRoot,
  getNormalizedPathComponents,
  getPathComponents,
  getPathFromPathComponents,
  getRelativePathFromDirectory,
  getRootLength,
  hasTrailingDirectorySeparator,
  isAnyDirectorySeparator,
  isPathAbsolute,
  isUrl,
  joinPaths,
  normalizePath,
  normalizeSlashes,
  reducePathComponents,
  removeTrailingDirectorySeparator,
  resolvePath,
} from "./core/path-utils.js";
export { compile, type Program } from "./core/program.js";
export {
  getProperty,
  mapEventEmitterToNodeListener,
  navigateProgram,
  navigateType,
  navigateTypesInNamespace,
  scopeNavigationToNamespace,
  type EventEmitter,
  type NamespaceNavigationOptions,
  type NavigationOptions,
} from "./core/semantic-walker.js";
export { createSourceFile, getSourceFileKindFromExt } from "./core/source-file.js";
export {
  isArrayModelType,
  isDeclaredInNamespace,
  isDeclaredType,
  isErrorType,
  isGlobalNamespace,
  isNeverType,
  isNullType,
  isRecordModelType,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  isTemplateInstance,
  isType,
  isUnknownType,
  isValue,
  isVoidType,
} from "./core/type-utils.js";
export { ListenerFlow, NoTarget } from "./core/types.js";
export type {
  ArrayModelType,
  ArrayValue,
  BaseType,
  BlockComment,
  BooleanLiteral,
  BooleanValue,
  CallableMessage,
  CodeFix,
  CodeFixContext,
  CodeFixEdit,
  Comment,
  CompilerHost,
  CompilerLocationContext,
  Declaration,
  DecoratedType,
  Decorator,
  DecoratorApplication,
  DecoratorArgument,
  DecoratorArgumentValue,
  DecoratorContext,
  DecoratorFunction,
  DecoratorImplementations,
  DeprecatedDirective,
  Diagnostic,
  DiagnosticCreator,
  DiagnosticDefinition,
  DiagnosticFormat,
  DiagnosticMap,
  DiagnosticMessages,
  DiagnosticReport,
  DiagnosticReportWithoutTarget,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticTarget,
  Directive,
  DirectiveArgument,
  DirectiveBase,
  DocContent,
  EmitContext,
  EmitOptionsFor,
  EmitterFunc,
  Entity,
  Enum,
  EnumMember,
  EnumValue,
  ErrorType,
  Expression,
  FileLibraryMetadata,
  FilePos,
  FunctionParameter,
  FunctionParameterBase,
  IdentifierContext,
  IdentifierKind,
  IndeterminateEntity,
  InsertTextCodeFixEdit,
  Interface,
  IntrinsicScalarName,
  IntrinsicType,
  JSONSchemaType,
  LibraryInstance,
  LibraryLocationContext,
  LibraryMetadata,
  LineAndCharacter,
  LineComment,
  LinterDefinition,
  LinterResolvedDefinition,
  LinterRule,
  LinterRuleContext,
  LinterRuleDefinition,
  LinterRuleDiagnosticFormat,
  LinterRuleDiagnosticReport,
  LinterRuleDiagnosticReportWithoutTarget,
  LinterRuleSet,
  LiteralType,
  LocationContext,
  Logger,
  LogInfo,
  LogLevel,
  LogSink,
  MarshalledValue,
  MemberContainerType,
  MemberType,
  MixedFunctionParameter,
  MixedParameterConstraint,
  Model,
  ModelIndexer,
  ModelProperty,
  Modifier,
  ModifierFlags,
  ModuleLibraryMetadata,
  Namespace,
  NeverIndexer,
  NeverType,
  NullType,
  NullValue,
  NumericLiteral,
  NumericValue,
  ObjectValue,
  ObjectValuePropertyDescriptor,
  Operation,
  OperationSignature,
  PackageFlags,
  ParseOptions,
  PositionDetail,
  ProcessedLog,
  ProjectLocationContext,
  RecordModelType,
  ReferenceExpression,
  RekeyableMap,
  ReplaceTextCodeFixEdit,
  RmOptions,
  RuleRef,
  Scalar,
  ScalarConstructor,
  ScalarValue,
  SemanticNodeListener,
  SignatureFunctionParameter,
  SourceFile,
  SourceFileKind,
  SourceLocation,
  SourceModel,
  StateDef,
  Statement,
  StdTypeName,
  StdTypes,
  StringLiteral,
  StringTemplate,
  StringTemplateSpan,
  StringTemplateSpanLiteral,
  StringTemplateSpanValue,
  StringValue,
  SuppressDirective,
  SyntheticLocationContext,
  TemplatedType,
  TemplatedTypeBase,
  TemplateInstanceTarget,
  TemplateParameter,
  TextRange,
  Tracer,
  TracerOptions,
  Tuple,
  Type,
  TypeInstantiationMap,
  TypeListeners,
  TypeMapper,
  TypeOfDiagnostics,
  TypeSpecDiagnosticTarget,
  TypeSpecLibrary,
  TypeSpecLibraryDef,
  Union,
  UnionVariant,
  UnknownType,
  Value,
  VoidType,
} from "./core/types.js";
export {
  addVisibilityModifiers,
  clearVisibilityModifiersForClass,
  getLifecycleVisibilityEnum,
  getVisibilityForClass,
  hasVisibility,
  isSealed,
  isVisible,
  removeVisibilityModifiers,
  resetVisibilityModifiersForClass,
  sealVisibilityModifiers,
  sealVisibilityModifiersForProgram,
  VisibilityFilter,
} from "./core/visibility/index.js";
