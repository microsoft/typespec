// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
// The Java emitter's model subset, adapted from @autorest/codemodel 4.20.1.
// Keep the constructor defaults and class identities compatible with code-model.yaml.
import type { DeepPartial } from "./codemodel-helpers.js";
import { Initializer, KnownMediaType } from "./codemodel-helpers.js";

function SetType<T extends object>(prototype: { prototype: object }, instance: T): T {
  return Object.setPrototypeOf(instance, prototype.prototype);
}

/** The Schema Object allows the definition of input and output data types. */
export interface Schema extends Aspect {
  /** per-language information for Schema */
  language: Languages;
  /** the schema type  */
  type: AllSchemaTypes;
  summary?: string;
  /** example information  */
  example?: any;
  /** If the value isn't sent on the wire, the service will assume this */
  defaultValue?: any;
  /** per-serialization information for this Schema  */
  serialization?: SerializationFormats;
}

export interface SecurityScheme {
  type: string;
}

export interface AnySchema extends Schema {}

/** an expression of an API version or api version range.
 *
 * @description - since API version formats range from
 * Azure ARM API date style (2018-01-01) to semver (1.2.3)
 * and virtually any other text, this value tends to be an
 * opaque string with the possibility of a modifier to indicate
 * that it is a range.
 *
 * options:
 *   - prepend a dash or append a plus to indicate a range
 *     (ie, '2018-01-01+' or '-2019-01-01', or '1.0+' )
 *
 *   - semver-range style (ie, '^1.0.0' or '~1.0.0' )
 */
export interface ApiVersion {
  /** the actual api version string used in the API */
  version: string;
  range?: "-" | "+";
}

/** a Schema that represents and array of values */
export interface ArraySchema<ElementType extends Schema = Schema> extends ValueSchema {
  /** the schema type  */
  type: SchemaType.Array;
  /** elementType of the array */
  elementType: ElementType;
  /** maximum number of elements in the array */
  maxItems?: number;
  /** minimum number of elements in the array */
  minItems?: number;
  /** if the elements in the array should be unique */
  uniqueItems?: boolean;
  /** if elements in the array should be nullable */
  nullableItems?: boolean;
}

/** a response where the content should be treated as a binary instead of a value or object */
export interface BinaryResponse extends Response {
  /** indicates that this response is a binary stream  */
  binary: true;
}

export interface BinarySchema extends Schema {}

/** a schema that represents a boolean value */
export interface BooleanSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Boolean;
}

/** a schema that represents a ByteArray value */
export interface ByteArraySchema extends ValueSchema {
  /** the schema type  */
  type: SchemaType.ByteArray;
  /** date-time format  */
  format: "base64url" | "byte";
}

/** an individual choice in a ChoiceSchema */
export interface ChoiceValue extends Extensions {
  /** per-language information for this value */
  language: Languages;
  /** the actual value  */
  value: string | number | boolean;
}

/** a schema that represents a Date value */
export interface DateSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Date;
}

/** a schema that represents a DateTime value */
export interface DateTimeSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.DateTime;
  /** date-time format  */
  format: "date-time-rfc1123" | "date-time";
}

/** a schema that represents a key-value collection */
export interface DictionarySchema<ElementType extends Schema = Schema> extends ComplexSchema {
  /** the schema type  */
  type: SchemaType.Dictionary;
  /** the element type of the dictionary. (Keys are always strings) */
  elementType: ElementType;
  /** if elements in the dictionary should be nullable */
  nullableItems?: boolean;
}

export interface Discriminator {
  property: Property;
  immediate: Record<string, ComplexSchema>;
  all: Record<string, ComplexSchema>;
}

export interface GroupProperty extends Property {
  originalParameter: Array<Parameter>;
}

export interface GroupSchema extends Schema, SchemaUsage {
  type: SchemaType.Group;
  properties?: Array<GroupProperty>;
}

export interface HttpHeader extends Extensions {
  header: string;
  schema: Schema;
  language: Languages;
}

/** extended metadata for HTTP operation parameters  */
export interface HttpParameter extends Protocol {
  /** the location that this parameter is placed in the http request */
  in: `${ParameterLocation}`;
  /** the Serialization Style used for the parameter. */
  style?: SerializationStyle;
  /** when set, 'form' style parameters generate separate parameters for each value of an array. */
  explode?: boolean;
  /** when set, this indicates that the content of the parameter should not be subject to URI encoding rules. */
  skipUriEncoding?: boolean;
}

export enum ImplementationLocation {
  /** should be exposed as a method parameter in the operation */
  Method = "Method",
  /** should be exposed as a client parameter (not exposed in the operation directly) */
  Client = "Client",
  /** should be used as input to constructing the context of the client (ie, 'profile') */
  Context = "Context",
}

export interface KeySecurityScheme extends SecurityScheme {
  type: "Key";
  in: "header";
  name: string;
}

/** the bare-minimum fields for per-language metadata on a given aspect */
export interface Language extends Record<string, any> {
  /** name used in actual implementation */
  name: string;
  /** description text - describes this node. */
  description: string;
}

/** license information  */
export interface License extends Extensions {
  /** the nameof the license */
  name: string;
  /** an uri pointing to the full license text */
  url?: uri;
}

/** common pattern for Metadata on aspects */
export interface Metadata extends Extensions {
  /** per-language information for this aspect */
  language: Languages;
  /** per-protocol information for this aspect  */
  protocol: Protocols;
}

/** a Schema that represents a Number value */
export interface NumberSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Number | SchemaType.Integer;
  /** precision (# of bits?) of the number */
  precision: number;
  /** if present, the number must be an exact multiple of this value */
  multipleOf?: number;
  /** if present, the value must be lower than or equal to this (unless exclusiveMaximum is true)  */
  maximum?: number;
  /** if present, the value must be lower than maximum   */
  exclusiveMaximum?: boolean;
  /** if present, the value must be highter than or equal to this (unless exclusiveMinimum is true)  */
  minimum?: number;
  /** if present, the value must be higher than minimum   */
  exclusiveMinimum?: boolean;
}

export interface OAuth2SecurityScheme extends SecurityScheme {
  type: "OAuth2";
  scopes: string[];
}

/** a schema that represents a type with child properties. */
export interface ObjectSchema extends ComplexSchema, SchemaUsage {
  /** the schema type  */
  type: SchemaType.Object;
  /** the property of the polymorphic descriminator for this type, if there is one */
  discriminator?: Discriminator;
  /** the collection of properties that are in this object */
  properties?: Array<Property>;
  /**  maximum number of properties permitted */
  maxProperties?: number;
  /**  minimum number of properties permitted */
  minProperties?: number;
  parents?: Relations;
  children?: Relations;
  discriminatorValue?: string;
}

/** an operation group represents a container around set of operations */
export interface OperationGroup extends Metadata {
  $key: string;
  operations: Array<Operation>;
}

/** a definition of an discrete input for an operation */
export interface Parameter extends Value {
  /** suggested implementation location for this parameter */
  implementation?: ImplementationLocation;
  /** When a parameter is flattened, it will be left in the list, but marked hidden (so, don't generate those!) */
  flattened?: boolean;
  /** When a parameter is grouped into another, this will tell where the parameter got grouped into. */
  groupedBy?: Parameter;
  /**
   * If this parameter is only part of the body request(for multipart and form bodies.)
   */
  isPartialBody?: boolean;
}

/** the location that this parameter is placed in the http request */
export enum ParameterLocation {
  /**  Parameters that are appended to the URL. For example, in /items?id=###, the query parameter is id */
  Query = "query",
  /**  Custom headers that are expected as part of the request. Note that RFC7230 states header names are case insensitive. */
  Header = "header",
  /** Used to pass a specific cookie value to the API. */
  Cookie = "cookie",
  /**  Used together with Path Templating, where the parameter value is actually part of the operation's URL. This does not include the host or base path of the API. For example, in /items/{itemId}, the path parameter is itemId. */
  Path = "path",
  /** Used to encode the parameter and send it as the HTTP body  */
  Body = "body",
  /** Used to associate the parameter to the Server/Uri (ie, parameterized host ) */
  Uri = "uri",
  /** Virtual parameters represent a connection to a specific spot in the body */
  Virtual = "virtual",
  /** Not directly used in a request, but may be used indirectly. */
  None = "none",
}

/** a property is a child value in an object */
export interface Property extends Value {
  /** if the property is marked read-only (ie, not intended to be sent to the service) */
  readOnly?: boolean;
  /** the wire name of this property */
  serializedName: string;
  /** when a property is flattened, the property will be the set of serialized names to get to that target property.
   *
   * If flattenedName is present, then this property is a flattened property.
   *
   * (ie, ['properties','name'] )
   *
   */
  flattenedNames?: Array<string>;
  /** if this property is used as a discriminator for a polymorphic type */
  isDiscriminator?: boolean;
}

export interface Relations {
  immediate: Array<ComplexSchema>;
  all: Array<ComplexSchema>;
}

/** a response from a service.  */
export interface Response extends Metadata {}

/** a response that should be deserialized into a result of type(schema) */
export interface SchemaResponse extends Response {
  /** the content returned by the service for a given operaiton */
  schema: Schema;
  /** indicates whether the response can be 'null' */
  nullable?: boolean;
}

/** possible schema types that indicate the type of schema.
 *
 * @note - this is essentially a discriminator for Schema
 */
export enum SchemaType {
  /** a collection of items */
  Array = "array",
  /** an associative array (ie, dictionary, hashtable, etc) */
  Dictionary = "dictionary",
  /** a true or false value */
  Boolean = "boolean",
  /** an integer value */
  Integer = "integer",
  /** a number value */
  Number = "number",
  /** an object of some type */
  Object = "object",
  /** a string of characters  */
  String = "string",
  /** UnixTime */
  UnixTime = "unixtime",
  /** ByteArray -- an array of bytes */
  ByteArray = "byte-array",
  Binary = "binary",
  /** a single character */
  Char = "char",
  /** a Date */
  Date = "date",
  /** a Date */
  Time = "time",
  /** a DateTime */
  DateTime = "date-time",
  /** a Duration */
  Duration = "duration",
  /** a universally unique identifier  */
  Uuid = "uuid",
  /** an URI of some kind */
  Uri = "uri",
  /**
   * Represent a Azure Resource Manager Resource ID.
   */
  ArmId = "arm-id",
  /** a password or credential  */
  Credential = "credential",
  /** OData Query */
  ODataQuery = "odata-query",
  /** a type that can be anything */
  Any = "any",
  /**
   * A type that can be any object. Like Any but cannot be a primitive type or array
   */
  AnyObject = "any-object",
  /** a choice between one of several  values (ie, 'enum')
   *
   * @description - this is essentially can be thought of as an 'enum'
   * that is a choice between one of several strings
   */
  Choice = "choice",
  SealedChoice = "sealed-choice",
  Conditional = "conditional",
  SealedConditional = "sealed-conditional",
  Flag = "flag",
  /** a constant value */
  Constant = "constant",
  Or = "or",
  Xor = "xor",
  Not = "not",
  /** the type is not known.
   *
   * @description it's possible that we just may make this an error
   * in representation.
   */
  Unknown = "unknown",
  Group = "group",
}

/**
 * The security information for the API surface
 */
export interface Security {
  /**
   * indicates that the API surface requires authentication
   */
  authenticationRequired: boolean;
  /**
   * @items {"type": "SecuritySchemeFull"}
   */
  schemes: SecurityScheme[];
}

/**
 * The Serialization Style used for the parameter.
 *
 * Describes how the parameter value will be serialized depending on the type of the parameter value.
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 */
export enum SerializationStyle {
  /**
   * Path-style parameters defined by RFC6570
   *
   *
   * @type primitive, array, object
   * @in path
   */
  Matrix = "matrix",
  /**
   * Label style parameters defined by RFC6570
   *
   * @type primitive, array, object
   * @in path
   */
  Label = "label",
  /**
   * Simple style parameters defined by RFC6570. This option replaces collectionFormat with a csv value from OpenAPI 2.0.
   *
   * @default - path and header
   * @type array
   * @in path, header
   */
  Simple = "simple",
  /**
   * Form style parameters defined by RFC6570. This option replaces collectionFormat with a csv (when explode is false) or multi (when explode is true) value from OpenAPI 2.0.
   *
   * @default - query and cookie
   * @type primitive, array, object
   * @in query, cookie, body
   */
  Form = "form",
  /**
   * Space separated array values. This option replaces collectionFormat equal to ssv from OpenAPI 2.0.
   *
   * @type array
   * @in query
   */
  SpaceDelimited = "spaceDelimited",
  /**
   * Pipe separated array values. This option replaces collectionFormat equal to pipes from OpenAPI 2.0.
   *
   * @type array
   * @in query
   */
  PipeDelimited = "pipeDelimited",
  /**
   * Provides a simple way of rendering nested objects using form parameters.
   *
   * @type object
   * @in query
   */
  DeepObject = "deepObject",
  /**
   * Serialize to JSON text
   *
   * @default - body
   * @type primitive, array, object
   * @in body
   */
  Json = "json",
  /**
   * Serialize to XML text
   *
   * @type primitive, array, object
   * @in body
   */
  Xml = "xml",
  /**
   * The content is a binary (stream)
   * @type binary
   * @in body
   */
  Binary = "binary",
  /**
   * Tab delimited array
   */
  TabDelimited = "tabDelimited",
}

/** a Schema that represents a string value */
export interface StringSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.String;
  /** the maximum length of the string */
  maxLength?: number;
  /** the minimum length of the string */
  minLength?: number;
  /** a regular expression that the string must be validated against */
  pattern?: string;
}

/** a schema that represents a Date value */
export interface TimeSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Time;
}

/** a schema that represents a UnixTime value */
export interface UnixTimeSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.UnixTime;
}

/** a schema that represents a Uri value */
export interface UriSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Uri;
  /** the maximum length of the string */
  maxLength?: number;
  /** the minimum length of the string */
  minLength?: number;
  /** a regular expression that the string must be validated against */
  pattern?: string;
}

/** a schema that represents a Uuid value */
export interface UuidSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Uuid;
}

export interface VirtualParameter extends Parameter {
  /** the original body parameter that this parameter is in effect replacing  */
  originalParameter: Parameter;
  /** if this parameter is for a nested property, this is the path of properties it takes to get there */
  pathToProperty: Array<Property>;
  /** the target property this virtual parameter represents */
  targetProperty: Property;
}

/** the full set of schemas for a given service, categorized into convenient collections */
export interface Schemas {
  /** a collection of items */
  arrays?: Array<ArraySchema>;
  /** an associative array (ie, dictionary, hashtable, etc) */
  dictionaries?: Array<DictionarySchema>;
  /** a true or false value */
  booleans?: Array<BooleanSchema>;
  /** a number value */
  numbers?: Array<NumberSchema>;
  /** an object of some type */
  objects?: Array<ObjectSchema>;
  /** a string of characters  */
  strings?: Array<StringSchema>;
  /** UnixTime */
  unixtimes?: Array<UnixTimeSchema>;
  /** ByteArray -- an array of bytes */
  byteArrays?: Array<ByteArraySchema>;
  /** a Date */
  dates?: Array<DateSchema>;
  /** a time */
  times?: Array<TimeSchema>;
  /** a DateTime */
  dateTimes?: Array<DateTimeSchema>;
  /** a Duration */
  durations?: Array<DurationSchema>;
  /** a universally unique identifier  */
  uuids?: Array<UuidSchema>;
  /** an URI of some kind */
  uris?: Array<UriSchema>;
  /** a choice between one of several  values (ie, 'enum')
   *
   * @description - this is essentially can be thought of as an 'enum'
   * that is a choice between one of several items, but an unspecified value is permitted.
   */
  choices?: Array<ChoiceSchema>;
  /** a choice between one of several  values (ie, 'enum')
   *
   * @description - this is essentially can be thought of as an 'enum'
   * that is a choice between one of several items, but an unknown value is not allowed.
   */
  sealedChoices?: Array<SealedChoiceSchema>;
  /** a constant value */
  constants?: Array<ConstantSchema>;
  ors?: Array<OrSchema>;
  binaries?: Array<BinarySchema>;
  groups?: Array<GroupSchema>;
  any?: Array<AnySchema>;
  anyObjects?: AnyObjectSchema[];
}

/** a collection of api versions */
export type ApiVersions = Array<ApiVersion>;

/** the base interface that represents an aspect of the model. */
export interface Aspect extends Metadata {
  /** a short description
   *
   * @note - this should not be the description over again.
   */
  summary?: string;
  /** API versions that this applies to. Undefined means all versions */
  apiVersions?: ApiVersions;
  /**
   * Represent the deprecation information if api is deprecated.
   * @default undefined
   */
  deprecated?: Deprecation;
  /** where did this aspect come from (jsonpath or 'modelerfour:<soemthing>') */
  origin?: string;
  /** External Documentation Links */
  externalDocs?: ExternalDocumentation;
}

/** code model information */
export interface Info extends Extensions {
  /** the title of this service. */
  title: string;
  /** a text description of the service  */
  description?: string;
  /** an uri to the terms of service specified to access the service */
  termsOfService?: uri;
  /** contact information for the service */
  contact?: Contact;
  /** license information for th service */
  license?: License;
  /** External Documentation  */
  externalDocs?: ExternalDocumentation;
}

export interface SerializationFormat extends Extensions, Record<string, any> {}

/** Schema types that are primitive language values */
export interface PrimitiveSchema extends ValueSchema {}

/** schema types that are non-object or complex types */
export interface ValueSchema extends Schema {}

/** A dictionary of open-ended 'x-*' extensions propogated from the original source document.
 *
 * @note - any unrecognized non-schema extensions found in the source model will be copied here verbatim
 *
 */
export interface Extensions {
  /** additional metadata extensions dictionary
   *
   * @notes - undefined means that there are no extensions present on the node.
   */
  extensions?: Record<string, any>;
}

/** custom extensible metadata for individual language generators */
export interface Languages {
  default: Language;
  csharp?: Language;
  python?: Language;
  ruby?: Language;
  go?: Language;
  typescript?: Language;
  javascript?: Language;
  powershell?: Language;
  java?: Language;
  c?: Language;
  cpp?: Language;
  swift?: Language;
  objectivec?: Language;
  sputnik?: Language;
}

/** schema types that can be objects */
export interface ComplexSchema extends Schema {}

/** all schema types */
export type AllSchemaTypes =
  | SchemaType.Any
  | SchemaType.AnyObject
  | ValueSchemaTypes
  | ObjectSchemaTypes
  | SchemaType.Constant
  | SchemaType.ODataQuery
  | SchemaType.Xor
  | SchemaType.Group
  | SchemaType.Not
  | SchemaType.Binary;

/** custom extensible metadata for individual serialization formats */
export interface SerializationFormats {
  json?: SerializationFormat;
  xml?: XmlSerlializationFormat;
  protobuf?: SerializationFormat;
  binary?: SerializationFormat;
}

export interface SchemaUsage {
  /** contexts in which the schema is used */
  usage?: SchemaContext[];
  /** Known media types in which this schema can be serialized */
  serializationFormats?: KnownMediaType[];
}

/** the bare-minimum fields for per-protocol metadata on a given aspect */
export interface Protocol extends Record<string, any> {}

/** an URI */
export type uri = string;

/** custom extensible metadata for individual protocols (ie, HTTP, etc) */
export interface Protocols {
  http?: Protocol;
  amqp?: Protocol;
  mqtt?: Protocol;
  jsonrpc?: Protocol;
}

/** represents a single callable endpoint with a discrete set of inputs, and any number of output possibilities (responses or exceptions)  */
export interface Operation extends Aspect {
  /**
   * Original Operation ID if present.
   * This can be used to identify the original id of an operation before it is styled.
   * THIS IS NOT the name of the operation that should be used in the generator. Use `.language.default.name` for this
   */
  operationId?: string;
  /** common parameters when there are multiple requests */
  parameters?: Array<Parameter>;
  /** a common filtered list of parameters that is (assumably) the actual method signature parameters */
  signatureParameters?: Array<Parameter>;
  /**
   * Mapping of all the content types available for this operation to the coresponding request.
   */
  requestMediaTypes?: Record<string, Request>;
  /**
   * List of headers that parameters should not handle as parameters but with special logic.
   * See https://github.com/Azure/autorest/tree/main/packages/extensions/modelerfour for configuration `skip-special-headers` to exclude headers.
   */
  specialHeaders?: string[];
  /** the different possibilities to build the request. */
  requests?: Array<Request>;
  /** responses that indicate a successful call */
  responses?: Array<Response>;
  /** responses that indicate a failed call */
  exceptions?: Array<Response>;
  /** the apiVersion to use for a given profile name */
  profile?: Record<string, ApiVersion>;
}

/** common base interface for properties, parameters and the like.  */
export interface Value extends Aspect {
  /** the schema of this Value */
  schema: Schema;
  /** if the value is marked 'required'. */
  required?: boolean;
  /** can null be passed in instead  */
  nullable?: boolean;
  /** the value that the remote will assume if this value is not present */
  assumedValue?: any;
  /** the value that the client should provide if the consumer doesn't provide one */
  clientDefaultValue?: any;
}

/** a schema that represents a Duration value */
export interface DurationSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Duration;
}

/** a schema that represents a choice of several values (ie, an 'enum') */
export interface ChoiceSchema<
  ChoiceType extends PrimitiveSchema = StringSchema,
> extends ValueSchema {
  /** the schema type  */
  type: SchemaType.Choice;
  /** the primitive type for the choices */
  choiceType: ChoiceType;
  /** the possible choices for in the set */
  choices: Array<ChoiceValue>;
}

/** a schema that represents a choice of several values (ie, an 'enum') */
export interface SealedChoiceSchema<
  ChoiceType extends PrimitiveSchema = StringSchema,
> extends ValueSchema {
  /** the schema type  */
  type: SchemaType.SealedChoice;
  /** the primitive type for the choices */
  choiceType: ChoiceType;
  /** the possible choices for in the set */
  choices: Array<ChoiceValue>;
}

/** a schema that represents a constant value */
export interface ConstantSchema<ConstantType extends Schema = Schema> extends Schema {
  /** the schema type  */
  type: SchemaType.Constant;
  /** the schema type of the constant value (ie, StringSchema, NumberSchema, etc) */
  valueType: ConstantType;
  /** the actual constant value */
  value: ConstantValue;
}

/** an OR relationship between several schemas
 *
 * @note - this expresses that the schema can be
 * any combination of the schema types given, which means
 * that this restricts the types to just <ObjectSchemaTypes>
 * because it does not make sense that a value can be a 'primitive'
 * and an 'object' at the same time. Nor does it make sense
 * that a value can be two primitive types at the same time.
 */
export interface OrSchema extends ComplexSchema {
  /** the set of schemas that this schema is composed of. Every schema is optional  */
  anyOf: Array<ComplexSchema>;
}

export interface AnyObjectSchema extends Schema {
  type: SchemaType.AnyObject;
}

/**
 *  Represent information about a deprecation
 */
export interface Deprecation {
  /**
   * Reason why this was deprecated.
   */
  reason?: string;
}

/** a reference to external documentation  */
export interface ExternalDocumentation extends Extensions {
  description?: string;
  url: uri;
}

/** contact information  */
export interface Contact extends Extensions {
  name?: string;
  url?: uri;
  email?: email;
}

/** schema types that are non-object or complex types */
export type ValueSchemaTypes =
  | SchemaType.ByteArray
  | PrimitiveSchemaTypes
  | SchemaType.Array
  | SchemaType.Choice
  | SchemaType.SealedChoice
  | SchemaType.Flag
  | SchemaType.Conditional
  | SchemaType.SealedConditional;

/** schema types that can be objects */
export type ObjectSchemaTypes = SchemaType.Or | SchemaType.Dictionary | SchemaType.Object;

export interface XmlSerlializationFormat extends SerializationFormat {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute: boolean;
  wrapped: boolean;
  text: boolean;
}

export enum SchemaContext {
  /** Schema is used as an input to an operation. */
  Input = "input",
  /** Schema is used as an output from an operation. */
  Output = "output",
  /** Schema is used as an exception from an operation. */
  Exception = "exception",
}

export interface Request extends Metadata {
  /** the parameter inputs to the operation */
  parameters?: Array<Parameter>;
  /** a filtered list of parameters that is (assumably) the actual method signature parameters */
  signatureParameters?: Array<Parameter>;
}

/** a container for the actual constant value */
export interface ConstantValue extends Extensions {
  /** per-language information for this value */
  language?: Languages;
  /** the actual constant value to use */
  value: any;
}

export type email = string;

/** Schema types that are primitive language values */
export type PrimitiveSchemaTypes =
  | SchemaType.Char
  | SchemaType.Date
  | SchemaType.Time
  | SchemaType.DateTime
  | SchemaType.Duration
  | SchemaType.Credential
  | SchemaType.UnixTime
  | SchemaType.Uri
  | SchemaType.Uuid
  | SchemaType.ArmId
  | SchemaType.Boolean
  | SchemaType.Integer
  | SchemaType.Number
  | SchemaType.String;

export class Metadata extends Initializer implements Metadata {
  constructor(objectInitializer?: DeepPartial<Metadata>) {
    super();
    this.language = SetType(Languages, {
      default: {
        name: "",
        description: "",
      },
    });
    this.protocol = SetType(Protocols, {});
    this.apply(objectInitializer);
  }
}

export class Aspect extends Metadata implements Aspect {
  constructor($key: string, description: string, initializer?: DeepPartial<Aspect>) {
    super();
    this.apply(
      {
        language: {
          default: {
            name: $key,
            description,
            //          uid: count++
          },
        },
        protocol: {},
      },
      initializer,
    );
  }
}

export class Schema extends Aspect implements Schema {
  declare type: AllSchemaTypes;

  constructor(
    schemaName: string,
    description: string,
    type: AllSchemaTypes,
    initializer?: DeepPartial<Schema>,
  ) {
    super(schemaName, description);
    this.type = type;
    this.apply(
      {
        language: {
          default: {},
        },
        protocol: {},
      },
      initializer,
    );
  }
}

export class AnySchema extends Schema implements AnySchema {
  constructor(description: string, objectInitializer?: DeepPartial<AnySchema>) {
    super("any", description, SchemaType.Any);
    this.apply(objectInitializer);
  }
}

export class ApiVersion implements ApiVersion {}

export class ArraySchema<ElementType extends Schema = Schema>
  extends Schema
  implements ArraySchema<ElementType>
{
  constructor(
    name: string,
    description: string,
    elementType: ElementType,
    objectInitializer?: DeepPartial<ArraySchema<ElementType>>,
  ) {
    super(name, description, SchemaType.Array);
    this.elementType = elementType;
    this.apply(objectInitializer);
  }
}

export class Response extends Metadata implements Response {
  constructor(objectInitializer?: DeepPartial<Response>) {
    super();
    this.apply(objectInitializer);
  }
}

export class BinaryResponse extends Response implements BinaryResponse {
  constructor(objectInitializer?: DeepPartial<BinaryResponse>) {
    super();
    this.binary = true;
    this.apply(objectInitializer);
  }
}

export class BinarySchema extends Schema implements BinarySchema {
  constructor(description: string, objectInitializer?: DeepPartial<BinarySchema>) {
    super("binary", description, SchemaType.Binary);
    this.apply(objectInitializer);
  }
}

export class PrimitiveSchema extends Schema implements PrimitiveSchema {
  constructor(
    name: string,
    description: string,
    schemaType: AllSchemaTypes,
    objectInitializer?: DeepPartial<PrimitiveSchema>,
  ) {
    super(name.indexOf("\u00b7") > -1 ? schemaType : name, description, schemaType);
    this.apply(objectInitializer);
  }
}

export class BooleanSchema extends PrimitiveSchema implements BooleanSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<BooleanSchema>) {
    super(name, description, SchemaType.Boolean);
    this.apply(objectInitializer);
  }
}

export class ByteArraySchema extends Schema implements ByteArraySchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<ByteArraySchema>) {
    super(name, description, SchemaType.ByteArray);
    this.apply(objectInitializer);
  }
}

export class ChoiceValue extends Initializer {
  constructor(
    name: string,
    description: string,
    value: string | number | boolean,
    objectInitializer?: DeepPartial<ChoiceValue>,
  ) {
    super();
    this.value = value;
    this.language = {
      default: {
        name,
        description,
      },
    };
    this.apply(objectInitializer);
  }
}

export class DateSchema extends PrimitiveSchema implements DateSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<DateSchema>) {
    super(name, description, SchemaType.Date);
    this.apply(objectInitializer);
  }
}

export class DateTimeSchema extends PrimitiveSchema implements DateTimeSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<DateTimeSchema>) {
    super(name, description, SchemaType.DateTime);
    this.apply(objectInitializer);
  }
}

export class DictionarySchema<ElementType extends Schema = Schema>
  extends Schema
  implements DictionarySchema<ElementType>
{
  constructor(
    name: string,
    description: string,
    elementType: ElementType,
    objectInitializer?: DeepPartial<DictionarySchema<ElementType>>,
  ) {
    super(name, description, SchemaType.Dictionary);
    this.elementType = elementType;
    this.apply(objectInitializer);
  }
}

export class Discriminator implements Discriminator {
  declare property: Property;

  constructor(property: Property) {
    this.property = property;
    this.immediate = {};
    this.all = {};
  }
}

export class Value extends Aspect implements Value {
  constructor($key: string, description: string, schema: Schema, initializer?: DeepPartial<Value>) {
    super($key, description);
    this.schema = schema;
    this.apply(initializer);
  }
}

export class Property extends Value implements Property {
  constructor(
    name: string,
    description: string,
    schema: Schema,
    initializer?: DeepPartial<Property>,
  ) {
    super(name, description, schema);
    this.serializedName = name;
    this.applyWithExclusions(["schema"], initializer);
  }
}

export class GroupProperty extends Property implements GroupProperty {
  declare originalParameter: Parameter[];

  constructor(
    name: string,
    description: string,
    schema: Schema,
    initializer?: DeepPartial<GroupProperty>,
  ) {
    super(name, description, schema);
    this.originalParameter = [];
    this.applyWithExclusions(["schema"], initializer);
  }
}

export class GroupSchema extends Schema implements GroupSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<GroupSchema>) {
    super(name, description, SchemaType.Group);
    this.apply(objectInitializer);
  }

  add(property: GroupProperty): GroupProperty {
    (this.properties = this.properties || []).push(property);
    return property;
  }
}

export class HttpHeader extends Initializer implements HttpHeader {
  declare header: string;

  declare schema: Schema;

  constructor(header: string, schema: Schema, objectInitializer?: DeepPartial<HttpHeader>) {
    super();
    this.header = header;
    this.schema = schema;
    this.apply(objectInitializer);
  }
}

export class Protocol extends Initializer implements Protocol {
  constructor(objectInitializer?: DeepPartial<Protocol>) {
    super();
    this.apply(objectInitializer);
  }
}

export class HttpParameter extends Protocol {
  constructor(location: `${ParameterLocation}`, objectInitializer?: DeepPartial<HttpParameter>) {
    super();
    this.in = location;
    this.apply(objectInitializer);
  }
}

export class KeySecurityScheme implements KeySecurityScheme {
  constructor(objectInitializer?: DeepPartial<KeySecurityScheme>) {
    this.type = "Key";
    Object.assign(this, objectInitializer);
  }
}

export class Language implements Language {}

export class License extends Initializer implements License {
  declare name: string;

  constructor(name: string, initializer?: DeepPartial<License>) {
    super();
    this.name = name;
    this.apply(initializer);
  }
}

export class NumberSchema extends PrimitiveSchema implements NumberSchema {
  constructor(
    name: string,
    description: string,
    type: SchemaType.Number | SchemaType.Integer,
    precision: number,
    objectInitializer?: DeepPartial<NumberSchema>,
  ) {
    super(name, description, type);
    this.apply({ precision }, objectInitializer);
  }
}

export class OAuth2SecurityScheme implements OAuth2SecurityScheme {
  constructor(objectInitializer?: DeepPartial<OAuth2SecurityScheme>) {
    this.type = "OAuth2";
    Object.assign(this, objectInitializer);
  }
}

export class ObjectSchema extends Schema implements ObjectSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<ObjectSchema>) {
    super(name, description, SchemaType.Object);
    this.apply(objectInitializer);
  }

  addProperty(property: Property): Property {
    (this.properties = this.properties || []).push(property);
    return property;
  }
}

export class OperationGroup extends Metadata implements OperationGroup {
  constructor(name: string, objectInitializer?: DeepPartial<OperationGroup>) {
    super();
    this.$key = name;
    this.apply(objectInitializer);
    this.language.default.name = name;
  }

  addOperation(operation: Operation): Operation {
    (this.operations = this.operations || []).push(operation);
    return operation;
  }
}

export class Parameter extends Value implements Parameter {
  constructor(
    name: string,
    description: string,
    schema: Schema,
    initializer?: DeepPartial<Parameter>,
  ) {
    super(name, description, schema);
    this.apply(initializer);
  }
}

export class Relations {
  constructor() {
    this.immediate = [];
    this.all = [];
  }
}

export class SchemaResponse extends Response implements SchemaResponse {
  constructor(schema: Schema, objectInitializer?: DeepPartial<SchemaResponse>) {
    super();
    this.schema = schema;
    this.apply(objectInitializer);
  }
}

export class Security extends Initializer implements Security {
  declare authenticationRequired: boolean;

  constructor(authenticationRequired: boolean, objectInitializer?: DeepPartial<Security>) {
    super();
    this.authenticationRequired = authenticationRequired;
    this.schemes = [];
    this.apply(objectInitializer);
  }
}

export class StringSchema extends PrimitiveSchema implements StringSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<StringSchema>) {
    super(name, description, SchemaType.String);
    this.apply(objectInitializer);
  }
}

export class TimeSchema extends PrimitiveSchema implements TimeSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<TimeSchema>) {
    super(name, description, SchemaType.Time);
    this.apply(objectInitializer);
  }
}

export class UnixTimeSchema extends PrimitiveSchema implements UnixTimeSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<UnixTimeSchema>) {
    super(name, description, SchemaType.UnixTime);
    this.apply(objectInitializer);
  }
}

export class UriSchema extends PrimitiveSchema implements UriSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<UriSchema>) {
    super(name, description, SchemaType.Uri);
    this.apply(objectInitializer);
  }
}

export class UuidSchema extends PrimitiveSchema implements UuidSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<UuidSchema>) {
    super(name, description, SchemaType.Uuid);
    this.apply(objectInitializer);
  }
}

export class VirtualParameter extends Parameter implements VirtualParameter {
  constructor(
    name: string,
    description: string,
    schema: Schema,
    initializer?: DeepPartial<VirtualParameter>,
  ) {
    super(name, description, schema);
    this.applyWithExclusions(["schema"], initializer);
  }
}

export class Info extends Initializer implements Info {
  declare title: string;

  constructor(title: string, initializer?: DeepPartial<Info>) {
    super();
    this.title = title;
    this.apply(initializer);
  }
}

export class Schemas {
  add<T extends Schema>(schema: T): T;
  add(schema: Schema): Schema {
    if (schema instanceof AnySchema) {
      if (!this.any?.[0]) this.any = [schema];
      return this.any[0];
    }
    if (schema instanceof AnyObjectSchema) {
      if (!this.anyObjects?.[0]) this.anyObjects = [schema];
      return this.anyObjects[0];
    }
    const group = schemaCollectionNames[schema.type];
    if (!group) throw new Error(`Unsupported schema collection: ${schema.type}`);
    const collection: Schema[] = this[group] ?? (this[group] = []);
    if (
      schema instanceof ConstantSchema ||
      schema instanceof PrimitiveSchema ||
      schema instanceof ArraySchema ||
      schema instanceof ByteArraySchema ||
      schema instanceof DictionarySchema ||
      schema instanceof ChoiceSchema ||
      schema instanceof SealedChoiceSchema
    ) {
      if (canStringify(schema)) {
        const serialized = JSON.stringify(schema);
        for (const candidate of collection) {
          if (!canStringify(candidate)) break;
          if (JSON.stringify(candidate) === serialized) return candidate;
        }
      }
    }
    if (collection.includes(schema))
      throw new Error(`Duplicate ! ${schema.type} : ${schema.language.default.name}`);
    collection.push(schema);
    return schema;
  }
}

export class Languages implements Languages {}

export class Protocols implements Protocols {}

export class ConstantSchema<ConstantType extends Schema = Schema>
  extends Schema
  implements ConstantSchema<ConstantType>
{
  constructor(
    name: string,
    description: string,
    objectInitializer?: DeepPartial<ConstantSchema<ConstantType>>,
  ) {
    super(name, description, SchemaType.Constant);
    this.apply(objectInitializer);
  }
}

export class ChoiceSchema<ChoiceType extends PrimitiveSchema = StringSchema>
  extends Schema
  implements ChoiceSchema<ChoiceType>
{
  constructor(
    name: string,
    description: string,
    objectInitializer?: DeepPartial<ChoiceSchema<ChoiceType>>,
  ) {
    super(name, description, SchemaType.Choice);
    this.apply(objectInitializer);
  }
}

export class SealedChoiceSchema<ChoiceType extends PrimitiveSchema = StringSchema>
  extends Schema
  implements SealedChoiceSchema<ChoiceType>
{
  constructor(
    name: string,
    description: string,
    objectInitializer?: DeepPartial<ChoiceSchema<ChoiceType>>,
  ) {
    super(name, description, SchemaType.SealedChoice);
    this.apply(objectInitializer);
  }
}

export class AnyObjectSchema extends Schema implements AnyObjectSchema {
  constructor(description: string, objectInitializer?: DeepPartial<AnyObjectSchema>) {
    super("AnyObject", description, SchemaType.AnyObject);
    this.apply(objectInitializer);
  }
}

const schemaCollectionNames: Partial<Record<SchemaType, Exclude<keyof Schemas, "add">>> = {
  [SchemaType.Array]: "arrays",
  [SchemaType.Dictionary]: "dictionaries",
  [SchemaType.Boolean]: "booleans",
  [SchemaType.Integer]: "numbers",
  [SchemaType.Number]: "numbers",
  [SchemaType.Object]: "objects",
  [SchemaType.String]: "strings",
  [SchemaType.UnixTime]: "unixtimes",
  [SchemaType.ByteArray]: "byteArrays",
  [SchemaType.Binary]: "binaries",
  [SchemaType.Date]: "dates",
  [SchemaType.Time]: "times",
  [SchemaType.DateTime]: "dateTimes",
  [SchemaType.Duration]: "durations",
  [SchemaType.Uuid]: "uuids",
  [SchemaType.Uri]: "uris",
  [SchemaType.Choice]: "choices",
  [SchemaType.SealedChoice]: "sealedChoices",
  [SchemaType.Constant]: "constants",
  [SchemaType.Or]: "ors",
  [SchemaType.Group]: "groups",
};

function canStringify(value: unknown, ancestors = new Set<object>()): boolean {
  if (typeof value === "bigint") return false;
  if (typeof value !== "object" || value === null) return true;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  const result = Object.values(value).every((child) => canStringify(child, ancestors));
  ancestors.delete(value);
  return result;
}
