import {
  DateTimeKnownEncoding,
  Diagnostic,
  DurationKnownEncoding,
  EmitContext,
  Enum,
  Interface,
  IntrinsicScalarName,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  PagingOperation,
  Program,
  Type,
  Union,
} from "@typespec/compiler";
import { unsafe_Realm } from "@typespec/compiler/experimental";
import {
  HttpAuth,
  HttpOperation,
  HttpOperationResponse,
  HttpStatusCodeRange,
  HttpVerb,
  Visibility,
} from "@typespec/http";

// ============================================================================
// Core Context
// ============================================================================

/**
 * Internal context node type for naming.
 */
export interface ContextNode {
  type: Type;
  name: string;
}

/**
 * Core TCG context — no Azure-specific fields.
 * The Azure extension adds `arm?: boolean` and related behaviors.
 */
export interface TCGCContext {
  program: Program;
  diagnostics: readonly Diagnostic[];
  emitterName: string;

  generateProtocolMethods?: boolean;
  generateConvenienceMethods?: boolean;
  examplesDir?: string;
  namespaceFlag?: string;
  apiVersion?: string;
  license?: {
    name: string;
    company?: string;
    header?: string;
    link?: string;
    description?: string;
  };

  decoratorsAllowList?: string[];
  previewStringRegex: RegExp;
  disableUsageAccessPropagationToBase: boolean;
  flattenUnionAsEnum?: boolean;
  enableLegacyHierarchyBuilding?: boolean;

  __referencedTypeCache: Map<Type, SdkModelType | SdkEnumType | SdkUnionType | SdkNullableType>;
  __arrayDictionaryCache: Map<Type, SdkDictionaryType | SdkArrayType>;
  __methodParameterCache: Map<ModelProperty, SdkMethodParameter>;
  __modelPropertyCache: Map<ModelProperty, SdkModelPropertyType>;
  __responseHeaderCache: Map<ModelProperty, SdkServiceResponseHeader>;
  __generatedNames: Map<Type, string>;
  __httpOperationCache: Map<Operation, HttpOperation>;
  __tspTypeToApiVersions: Map<Type, string[]>;
  __explicitClients?: Set<SdkClient>;
  __rawClientsCache?: Map<Namespace | Interface | string, SdkClient>;
  __clientToOperationsCache?: Map<SdkClient, Operation[]>;
  __operationToClientCache?: Map<Operation, SdkClient>;
  __clientParametersCache: Map<SdkClient, SdkMethodParameter[]>;
  __clientApiVersionDefaultValueCache: Map<SdkClient, string | undefined>;
  __httpOperationExamples: Map<HttpOperation, SdkHttpOperationExample[]>;
  __pagedResultSet: Set<SdkType>;
  __namingContextPath: ContextNode[];
  __orphanTypesCache?: (Model | Enum | Union)[];
  __mutatedGlobalNamespace?: Namespace;
  __mutatedRealm?: unsafe_Realm;
  __packageVersions?: Map<Namespace, string[]>;
  __packageVersionEnum?: Map<Namespace, Enum | undefined>;
  __externalPackageToVersions?: Map<string, string>;

  getMutatedGlobalNamespace(): Namespace;
  getApiVersionsForType(type: Type): string[];
  setApiVersionsForType(type: Type, apiVersions: string[]): void;
  getPackageVersions(): Map<Namespace, string[]>;
  getPackageVersionEnum(): Map<Namespace, Enum | undefined>;
  getClients(): SdkClient[];
  getRootClients(): SdkClient[];
  getClient(type: Namespace | Interface): SdkClient | undefined;
  getOperationsForClient(client: SdkClient): Operation[];
  getClientForOperation(operation: Operation): SdkClient;
}

export interface SdkContext<
  TOptions extends object = Record<string, any>,
  TServiceOperation extends SdkServiceOperation = SdkHttpOperation,
> extends TCGCContext {
  emitContext: EmitContext<TOptions>;
  sdkPackage: SdkPackage<TServiceOperation>;
}

// ============================================================================
// Client Types
// ============================================================================

export interface SdkClient {
  kind: "SdkClient";
  name: string;
  services: Namespace[];
  /** The type associated with this client. */
  type?: Namespace | Interface;
  subClients: SdkClient[];
  clientPath: string;
  parent?: SdkClient;
  autoMergeService?: boolean;
}

export type AccessFlags = "internal" | "public";

/**
 * This enum represents the different ways a model can be used in a method.
 */
export enum UsageFlags {
  None = 0,
  Input = 1 << 1,
  Output = 1 << 2,
  ApiVersionEnum = 1 << 3,
  JsonMergePatch = 1 << 4,
  MultipartFormData = 1 << 5,
  Spread = 1 << 6,
  Json = 1 << 8,
  Xml = 1 << 9,
  Exception = 1 << 10,
  LroInitial = 1 << 11,
  LroPolling = 1 << 12,
  LroFinalEnvelope = 1 << 13,
  External = 1 << 14,
}

/**
 * Flags used to indicate how a client is initialized.
 */
export enum InitializedByFlags {
  Default = 0,
  CustomizeCode = 1 << 2,
  Individually = 1 << 0,
  Parent = 1 << 1,
}

export interface ClientInitializationOptions {
  parameters?: Model;
  initializedBy?: InitializedByFlags;
}

// ============================================================================
// Decorator Types
// ============================================================================

export interface DecoratedType {
  decorators: DecoratorInfo[];
}

export interface DecoratorInfo {
  name: string;
  arguments: Record<string, any>;
}

// ============================================================================
// Client Type Graph
// ============================================================================

export interface SdkClientType<TServiceOperation extends SdkServiceOperation>
  extends DecoratedType {
  __raw: SdkClient;
  kind: "client";
  name: string;
  namespace: string;
  doc?: string;
  summary?: string;
  clientInitialization: SdkClientInitializationType;
  methods: SdkMethod<TServiceOperation>[];
  apiVersions: string[];
  crossLanguageDefinitionId: string;
  parent?: SdkClientType<TServiceOperation>;
  children?: SdkClientType<TServiceOperation>[];
}

// ============================================================================
// SDK Type System
// ============================================================================

interface ExternalType {
  external?: ExternalTypeInfo;
}

export interface ExternalTypeInfo {
  kind: "externalTypeInfo";
  identity: string;
  package?: string;
  minVersion?: string;
}

interface SdkTypeBase extends DecoratedType, ExternalType {
  __raw?: Type;
  kind: string;
  deprecation?: string;
  doc?: string;
  summary?: string;
  __accessSet?: boolean;
}

export type SdkType =
  | SdkBuiltInType
  | SdkDateTimeType
  | SdkDurationType
  | SdkArrayType
  | SdkTupleType
  | SdkDictionaryType
  | SdkNullableType
  | SdkEnumType
  | SdkEnumValueType
  | SdkConstantType
  | SdkUnionType
  | SdkModelType
  | SdkCredentialType
  | SdkEndpointType;

export interface SdkBuiltInType<TKind extends SdkBuiltInKinds = SdkBuiltInKinds>
  extends SdkTypeBase {
  kind: TKind;
  encode?: string;
  name: string;
  baseType?: SdkBuiltInType<TKind>;
  crossLanguageDefinitionId: string;
}

type TypeEquality<T, U> = keyof T extends keyof U
  ? keyof U extends keyof T
    ? true
    : false
  : false;

type SupportedBuiltInKinds =
  | keyof typeof SdkIntKindsEnum
  | keyof typeof SdkFloatingPointKindsEnum
  | keyof typeof SdkFixedPointKindsEnum
  | keyof typeof SdkGenericBuiltInStringKindsEnum
  | keyof typeof SdkBuiltInKindsMiscellaneousEnum;

const _: TypeEquality<Exclude<SupportedBuiltInKinds, SdkBuiltInKinds>, never> = true;
const __: TypeEquality<Exclude<SdkBuiltInKinds, SupportedBuiltInKinds>, never> = true;

enum SdkIntKindsEnum {
  numeric = "numeric",
  integer = "integer",
  safeint = "safeint",
  int8 = "int8",
  int16 = "int16",
  int32 = "int32",
  int64 = "int64",
  uint8 = "uint8",
  uint16 = "uint16",
  uint32 = "uint32",
  uint64 = "uint64",
}

enum SdkFloatingPointKindsEnum {
  float = "float",
  float32 = "float32",
  float64 = "float64",
}

enum SdkFixedPointKindsEnum {
  decimal = "decimal",
  decimal128 = "decimal128",
}

enum SdkGenericBuiltInStringKindsEnum {
  string = "string",
  url = "url",
}

enum SdkBuiltInKindsMiscellaneousEnum {
  bytes = "bytes",
  boolean = "boolean",
  plainDate = "plainDate",
  plainTime = "plainTime",
  unknown = "unknown",
}

export type SdkBuiltInKinds = Exclude<IntrinsicScalarName, SdkBuiltInKindsExcludes> | "unknown";
type SdkBuiltInKindsExcludes = "utcDateTime" | "offsetDateTime" | "duration";

export function getKnownScalars(): Record<string, SdkBuiltInKinds> {
  const retval: Record<string, SdkBuiltInKinds> = {};
  const typespecNamespace = Object.keys(SdkBuiltInKindsMiscellaneousEnum)
    .concat(Object.keys(SdkIntKindsEnum))
    .concat(Object.keys(SdkFloatingPointKindsEnum))
    .concat(Object.keys(SdkFixedPointKindsEnum))
    .concat(Object.keys(SdkGenericBuiltInStringKindsEnum));
  for (const kind of typespecNamespace) {
    if (!isSdkBuiltInKind(kind)) continue;
    retval[`TypeSpec.${kind}`] = kind;
  }
  return retval;
}

export function isSdkBuiltInKind(kind: string): kind is SdkBuiltInKinds {
  return (
    kind in SdkBuiltInKindsMiscellaneousEnum ||
    isSdkIntKind(kind) ||
    isSdkFloatKind(kind) ||
    isSdkFixedPointKind(kind) ||
    kind in SdkGenericBuiltInStringKindsEnum
  );
}

export function isSdkIntKind(kind: string): kind is keyof typeof SdkIntKindsEnum {
  return kind in SdkIntKindsEnum;
}

export function isSdkFloatKind(kind: string): kind is keyof typeof SdkFloatingPointKindsEnum {
  return kind in SdkFloatingPointKindsEnum;
}

function isSdkFixedPointKind(kind: string): kind is keyof typeof SdkFixedPointKindsEnum {
  return kind in SdkFixedPointKindsEnum;
}

const SdkDateTimeEncodingsConst = ["rfc3339", "rfc7231", "unixTimestamp"] as const;

export function isSdkDateTimeEncodings(encoding: string): encoding is DateTimeKnownEncoding {
  return SdkDateTimeEncodingsConst.includes(encoding as DateTimeKnownEncoding);
}

interface SdkDateTimeTypeBase extends SdkTypeBase {
  name: string;
  baseType?: SdkDateTimeType;
  encode: DateTimeKnownEncoding | string;
  wireType: SdkBuiltInType;
  crossLanguageDefinitionId: string;
}

interface SdkUtcDateTimeType extends SdkDateTimeTypeBase {
  kind: "utcDateTime";
}

interface SdkOffsetDateTimeType extends SdkDateTimeTypeBase {
  kind: "offsetDateTime";
}

export type SdkDateTimeType = SdkUtcDateTimeType | SdkOffsetDateTimeType;

export interface SdkDurationType extends SdkTypeBase {
  kind: "duration";
  name: string;
  baseType?: SdkDurationType;
  encode: DurationKnownEncoding | string;
  wireType: SdkBuiltInType;
  crossLanguageDefinitionId: string;
}

export interface SdkArrayType extends SdkTypeBase {
  kind: "array";
  name: string;
  valueType: SdkType;
  crossLanguageDefinitionId: string;
}

export interface SdkTupleType extends SdkTypeBase {
  kind: "tuple";
  valueTypes: SdkType[];
}

export interface SdkDictionaryType extends SdkTypeBase {
  kind: "dict";
  keyType: SdkType;
  valueType: SdkType;
}

export interface SdkNullableType extends SdkTypeBase {
  kind: "nullable";
  name: string;
  isGeneratedName: boolean;
  isExactName: boolean;
  crossLanguageDefinitionId: string;
  type: SdkType;
  usage: UsageFlags;
  access: AccessFlags;
  namespace: string;
}

export interface SdkEnumType extends SdkTypeBase {
  kind: "enum";
  name: string;
  isGeneratedName: boolean;
  isExactName: boolean;
  namespace: string;
  valueType: SdkBuiltInType;
  values: SdkEnumValueType[];
  isFixed: boolean;
  isFlags: boolean;
  usage: UsageFlags;
  access: AccessFlags;
  crossLanguageDefinitionId: string;
  apiVersions: string[];
  isUnionAsEnum: boolean;
}

export interface SdkEnumValueType<TValueType extends SdkTypeBase = SdkBuiltInType>
  extends SdkTypeBase {
  kind: "enumvalue";
  name: string;
  value: string | number;
  enumType: SdkEnumType;
  valueType: TValueType;
  crossLanguageDefinitionId: string;
}

export interface SdkConstantType extends SdkTypeBase {
  kind: "constant";
  value: string | number | boolean;
  valueType: SdkBuiltInType;
  name: string;
  isGeneratedName: boolean;
  isExactName: boolean;
}

export interface SdkUnionType<TValueType extends SdkTypeBase = SdkType> extends SdkTypeBase {
  name: string;
  isGeneratedName: boolean;
  isExactName: boolean;
  namespace: string;
  kind: "union";
  variantTypes: TValueType[];
  crossLanguageDefinitionId: string;
  access: AccessFlags;
  usage: UsageFlags;
  discriminatedOptions?: DiscriminatedOptions;
}

export interface DiscriminatedOptions {
  envelope: "object" | "none";
  discriminatorPropertyName: string;
  envelopePropertyName?: string;
}

export interface SdkModelType extends SdkTypeBase {
  kind: "model";
  properties: SdkModelPropertyType[];
  name: string;
  isGeneratedName: boolean;
  isExactName: boolean;
  namespace: string;
  access: AccessFlags;
  usage: UsageFlags;
  additionalProperties?: SdkType;
  discriminatorValue?: string;
  discriminatedSubtypes?: Record<string, SdkModelType>;
  discriminatorProperty?: SdkModelPropertyType;
  baseModel?: SdkModelType;
  crossLanguageDefinitionId: string;
  apiVersions: string[];
  serializationOptions: SerializationOptions;
}

export interface SdkClientInitializationType extends SdkTypeBase {
  kind: "clientinitialization";
  name: string;
  isGeneratedName: boolean;
  isExactName: boolean;
  parameters: (SdkEndpointParameter | SdkCredentialParameter | SdkMethodParameter)[];
  initializedBy: InitializedByFlags;
}

export interface SdkCredentialType extends SdkTypeBase {
  kind: "credential";
  scheme: HttpAuth;
}

export interface SdkEndpointType extends SdkTypeBase {
  kind: "endpoint";
  serverUrl: string;
  templateArguments: SdkPathParameter[];
}

// ============================================================================
// Property Types
// ============================================================================

export interface SdkModelPropertyTypeBase<TType extends SdkTypeBase = SdkType>
  extends DecoratedType {
  __raw?: ModelProperty;
  type: TType;
  name: string;
  isGeneratedName: boolean;
  isExactName: boolean;
  doc?: string;
  summary?: string;
  apiVersions: string[];
  onClient: boolean;
  clientDefaultValue?: unknown;
  isApiVersionParam: boolean;
  optional: boolean;
  crossLanguageDefinitionId: string;
  visibility?: Visibility[];
  access: AccessFlags;
  flatten: boolean;
  encode?: ArrayKnownEncoding;
}

export type ArrayKnownEncoding =
  | "pipeDelimited"
  | "spaceDelimited"
  | "commaDelimited"
  | "newlineDelimited";

export interface SerializationOptions {
  json?: JsonSerializationOptions;
  xml?: XmlSerializationOptions;
  multipart?: MultipartOptions;
  binary?: BinarySerializationOptions;
}

export interface JsonSerializationOptions {
  name: string;
}

export interface XmlSerializationOptions {
  name: string;
  attribute?: boolean;
  ns?: { namespace: string; prefix: string };
  unwrapped?: boolean;
  itemsName?: string;
  itemsNs?: { namespace: string; prefix: string };
}

export interface BinarySerializationOptions {
  isFile: boolean;
  isText?: boolean;
  contentTypes?: string[];
  filename?: ModelProperty;
}

export interface SdkEndpointParameter
  extends SdkModelPropertyTypeBase<SdkEndpointType | SdkUnionType<SdkEndpointType>> {
  kind: "endpoint";
  urlEncode: boolean;
  onClient: true;
  /** @deprecated Use `type.templateArguments[x].serializedName` instead. */
  serializedName?: string;
}

export interface SdkCredentialParameter
  extends SdkModelPropertyTypeBase<SdkCredentialType | SdkUnionType<SdkCredentialType>> {
  kind: "credential";
  onClient: true;
}

export interface MultipartOptions {
  name: string;
  isFilePart: boolean;
  isMulti: boolean;
  filename?: SdkModelPropertyType;
  contentType?: SdkModelPropertyType;
  defaultContentTypes: string[];
  headers: SdkHeaderParameter[];
}

export interface SdkModelPropertyType extends SdkModelPropertyTypeBase {
  kind: "property";
  discriminator: boolean;
  /** @deprecated Use `serializationOptions.xxx.name` instead. */
  serializedName: string;
  serializationOptions: SerializationOptions;
  /** @deprecated Use `multipartOptions?.isFilePart` instead. */
  isMultipartFileInput: boolean;
  /** @deprecated Use `serializationOptions.multipart` instead. */
  multipartOptions?: MultipartOptions;
}

export type CollectionFormat = "multi" | "csv" | "ssv" | "tsv" | "pipes" | "simple" | "form";

export interface SdkHeaderParameter extends SdkModelPropertyTypeBase {
  kind: "header";
  collectionFormat?: CollectionFormat;
  serializedName: string;
  /** @deprecated Use `methodParameterSegments` instead. */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
}

export interface SdkQueryParameter extends SdkModelPropertyTypeBase {
  kind: "query";
  collectionFormat?: CollectionFormat;
  serializedName: string;
  /** @deprecated Use `methodParameterSegments` instead. */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
  explode: boolean;
}

export interface SdkPathParameter extends SdkModelPropertyTypeBase {
  kind: "path";
  explode: boolean;
  style: "simple" | "label" | "matrix" | "fragment" | "path";
  allowReserved: boolean;
  serializedName: string;
  /** @deprecated Use `methodParameterSegments` instead. */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
}

export interface SdkCookieParameter extends SdkModelPropertyTypeBase {
  kind: "cookie";
  serializedName: string;
  /** @deprecated Use `methodParameterSegments` instead. */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
}

export interface SdkStreamMetadata {
  bodyType: SdkType;
  originalType: SdkType;
  streamType: SdkType;
  contentTypes: string[];
}

export interface SdkBodyParameter extends SdkModelPropertyTypeBase {
  kind: "body";
  serializedName: string;
  contentTypes: string[];
  defaultContentType: string;
  /** @deprecated Use `methodParameterSegments` instead. */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
  streamMetadata?: SdkStreamMetadata;
  serializationOptions: SerializationOptions;
}

export type SdkHttpParameter =
  | SdkQueryParameter
  | SdkPathParameter
  | SdkBodyParameter
  | SdkHeaderParameter
  | SdkCookieParameter;

export interface SdkMethodParameter extends SdkModelPropertyTypeBase {
  kind: "method";
}

export interface SdkServiceResponseHeader extends SdkModelPropertyTypeBase {
  __raw: ModelProperty;
  kind: "responseheader";
  serializedName: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SdkMethodResponse {
  kind: "method";
  type?: SdkType;
  resultSegments?: SdkModelPropertyType[];
  optional?: boolean;
  streamMetadata?: SdkStreamMetadata;
}

export interface SdkServiceResponse {
  type?: SdkType;
  headers: SdkServiceResponseHeader[];
  apiVersions: string[];
}

interface SdkHttpResponseBase extends SdkServiceResponse {
  __raw: HttpOperationResponse;
  kind: "http";
  contentTypes?: string[];
  defaultContentType?: string;
  description?: string;
  streamMetadata?: SdkStreamMetadata;
  serializationOptions: SerializationOptions;
}

export interface SdkHttpResponse extends SdkHttpResponseBase {
  statusCodes: number | HttpStatusCodeRange;
}

export interface SdkHttpErrorResponse extends SdkHttpResponseBase {
  statusCodes: number | HttpStatusCodeRange | "*";
}

// ============================================================================
// Operation Types
// ============================================================================

interface SdkServiceOperationBase {}

export interface SdkHttpOperation extends SdkServiceOperationBase {
  __raw: HttpOperation;
  kind: "http";
  path: string;
  uriTemplate: string;
  verb: HttpVerb;
  parameters: (SdkPathParameter | SdkQueryParameter | SdkHeaderParameter | SdkCookieParameter)[];
  bodyParam?: SdkBodyParameter;
  responses: SdkHttpResponse[];
  exceptions: SdkHttpErrorResponse[];
  examples?: SdkHttpOperationExample[];
}

export type SdkServiceOperation = SdkHttpOperation;

// ============================================================================
// Method Types (Core — extensible for LRO via Azure extension)
// ============================================================================

export interface SdkServiceMethodBase<TServiceOperation extends SdkServiceOperation>
  extends DecoratedType {
  __raw?: Operation;
  name: string;
  access: AccessFlags;
  apiVersions: string[];
  doc?: string;
  summary?: string;
  crossLanguageDefinitionId: string;
  operation: TServiceOperation;
  parameters: SdkMethodParameter[];
  response: SdkMethodResponse;
  exception?: SdkMethodResponse;
  generateConvenient: boolean;
  generateProtocol: boolean;
  isOverride: boolean;
}

/** Basic method. */
export interface SdkBasicServiceMethod<TServiceOperation extends SdkServiceOperation>
  extends SdkServiceMethodBase<TServiceOperation> {
  kind: "basic";
}

// ============================================================================
// Paging Types (Core — paging is a generic protocol concept)
// ============================================================================

export interface SdkPagingServiceMethodOptions<TServiceOperation extends SdkServiceOperation> {
  pagingMetadata: SdkPagingServiceMetadata<TServiceOperation>;
}

export interface SdkPagingServiceMetadata<TServiceOperation extends SdkServiceOperation> {
  __raw?: PagingOperation;
  nextLinkSegments?: (SdkServiceResponseHeader | SdkModelPropertyType)[];
  nextLinkOperation?: SdkServiceMethod<TServiceOperation>;
  nextLinkVerb?: "GET" | "POST";
  nextLinkReInjectedParametersSegments?: (SdkMethodParameter | SdkModelPropertyType)[][];
  continuationTokenParameterSegments?: (SdkMethodParameter | SdkModelPropertyType)[];
  continuationTokenResponseSegments?: (SdkServiceResponseHeader | SdkModelPropertyType)[];
  pageItemsSegments?: SdkModelPropertyType[];
  pageSizeParameterSegments?: (SdkMethodParameter | SdkModelPropertyType)[];
}

/** Paging method. */
export interface SdkPagingServiceMethod<TServiceOperation extends SdkServiceOperation>
  extends SdkServiceMethodBase<TServiceOperation>,
    SdkPagingServiceMethodOptions<TServiceOperation> {
  kind: "paging";
}

// ============================================================================
// Core Service Method Union
// ============================================================================

/**
 * Core service method types (basic + paging).
 * Azure extension adds LRO variants via its own extended union.
 */
export type SdkCoreServiceMethod<TServiceOperation extends SdkServiceOperation> =
  | SdkBasicServiceMethod<TServiceOperation>
  | SdkPagingServiceMethod<TServiceOperation>;

/**
 * Default service method union — same as core.
 * The Azure extension re-exports an augmented version that includes LRO types.
 */
export type SdkServiceMethod<TServiceOperation extends SdkServiceOperation> =
  SdkCoreServiceMethod<TServiceOperation>;

export type SdkMethod<TServiceOperation extends SdkServiceOperation> =
  SdkServiceMethod<TServiceOperation>;

// ============================================================================
// Package Types
// ============================================================================

export interface SdkPackage<TServiceOperation extends SdkServiceOperation> {
  clients: SdkClientType<TServiceOperation>[];
  models: SdkModelType[];
  enums: SdkEnumType[];
  unions: (SdkUnionType | SdkNullableType)[];
  crossLanguagePackageId: string;
  crossLanguageVersion: string;
  namespaces: SdkNamespace<TServiceOperation>[];
  licenseInfo?: LicenseInfo;
  metadata: {
    /** @deprecated Use `apiVersions` instead. */
    apiVersion?: string;
    apiVersions?: Map<string, string>;
  };
}

export interface LicenseInfo {
  name: string;
  company: string;
  link: string;
  header: string;
  description: string;
}

export interface SdkNamespace<TServiceOperation extends SdkServiceOperation> extends DecoratedType {
  __raw?: Namespace;
  name: string;
  fullName: string;
  clients: SdkClientType<TServiceOperation>[];
  models: SdkModelType[];
  enums: SdkEnumType[];
  unions: (SdkUnionType | SdkNullableType)[];
  namespaces: SdkNamespace<TServiceOperation>[];
}

export type SdkHttpPackage = SdkPackage<SdkHttpOperation>;

export type LanguageScopes = "dotnet" | "java" | "python" | "javascript" | "go" | string;

// ============================================================================
// Example Types
// ============================================================================

interface SdkExampleBase {
  kind: string;
  name: string;
  doc: string;
  filePath: string;
  rawExample: any;
}

export interface SdkHttpOperationExample extends SdkExampleBase {
  kind: "http";
  parameters: SdkHttpParameterExampleValue[];
  responses: SdkHttpResponseExampleValue[];
}

export interface SdkHttpParameterExampleValue {
  parameter: SdkHttpParameter;
  value: SdkExampleValue;
}

export interface SdkHttpResponseExampleValue {
  response: SdkHttpResponse;
  statusCode: number;
  headers: SdkHttpResponseHeaderExampleValue[];
  bodyValue?: SdkExampleValue;
}

export interface SdkHttpResponseHeaderExampleValue {
  header: SdkServiceResponseHeader;
  value: SdkExampleValue;
}

export type SdkExampleValue =
  | SdkStringExampleValue
  | SdkNumberExampleValue
  | SdkBooleanExampleValue
  | SdkNullExampleValue
  | SdkUnknownExampleValue
  | SdkArrayExampleValue
  | SdkDictionaryExampleValue
  | SdkUnionExampleValue
  | SdkModelExampleValue;

interface SdkExampleValueBase {
  kind: string;
  type: SdkType;
  value: unknown;
}

export interface SdkStringExampleValue extends SdkExampleValueBase {
  kind: "string";
  type:
    | SdkBuiltInType
    | SdkDateTimeType
    | SdkDurationType
    | SdkEnumType
    | SdkEnumValueType
    | SdkConstantType;
  value: string;
}

export interface SdkNumberExampleValue extends SdkExampleValueBase {
  kind: "number";
  type:
    | SdkBuiltInType
    | SdkDateTimeType
    | SdkDurationType
    | SdkEnumType
    | SdkEnumValueType
    | SdkConstantType;
  value: number;
}

export interface SdkBooleanExampleValue extends SdkExampleValueBase {
  kind: "boolean";
  type: SdkBuiltInType | SdkConstantType;
  value: boolean;
}

export interface SdkNullExampleValue extends SdkExampleValueBase {
  kind: "null";
  type: SdkNullableType;
  value: null;
}

export interface SdkUnknownExampleValue extends SdkExampleValueBase {
  kind: "unknown";
  type: SdkBuiltInType;
  value: unknown;
}

export interface SdkArrayExampleValue extends SdkExampleValueBase {
  kind: "array";
  type: SdkArrayType;
  value: SdkExampleValue[];
}

export interface SdkDictionaryExampleValue extends SdkExampleValueBase {
  kind: "dict";
  type: SdkDictionaryType;
  value: Record<string, SdkExampleValue>;
}

export interface SdkUnionExampleValue extends SdkExampleValueBase {
  kind: "union";
  type: SdkUnionType;
  value: unknown;
}

export interface SdkModelExampleValue extends SdkExampleValueBase {
  kind: "model";
  type: SdkModelType;
  value: Record<string, SdkExampleValue>;
  additionalPropertiesValue?: Record<string, SdkExampleValue>;
}
