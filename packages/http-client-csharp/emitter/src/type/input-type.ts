// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  AccessFlags,
  CollectionFormat,
  DecoratorInfo,
  SdkBuiltInKinds,
  SerializationOptions,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";
import { DateTimeKnownEncoding, DurationKnownEncoding } from "@typespec/compiler";
import { InputParameter } from "./input-parameter.js";
import { InputServiceMethod } from "./input-service-method.js";

/**
 * The input client type for the CSharp emitter.
 * @beta
 */
export interface InputClient extends DecoratedType {
  kind: "client";
  name: string;
  namespace: string;
  doc?: string;
  summary?: string;
  parameters?: InputParameter[]; // TODO -- this should be replaced by clientInitialization when the clientInitialization related stuffs are done: https://github.com/microsoft/typespec/issues/4366
  methods: InputServiceMethod[];
  apiVersions: string[];
  crossLanguageDefinitionId: string;
  parent?: InputClient;
  children?: InputClient[];
}

interface DecoratedType {
  decorators?: DecoratorInfo[];
}

interface InputTypeBase extends DecoratedType {
  kind: string;
  summary?: string;
  doc?: string;
  deprecation?: string;
}

export type InputType =
  | InputPrimitiveType
  | InputDateTimeType
  | InputDurationType
  | InputLiteralType
  | InputUnionType
  | InputModelType
  | InputEnumType
  | InputEnumValueType
  | InputArrayType
  | InputDictionaryType
  | InputNullableType;

export interface InputPrimitiveType extends InputTypeBase {
  kind: SdkBuiltInKinds;
  name: string;
  encode?: string; // In TCGC this is required, and when there is no encoding, it just has the same value as kind
  crossLanguageDefinitionId: string;
  baseType?: InputPrimitiveType;
}

export interface InputLiteralType extends InputTypeBase {
  kind: "constant";
  name: string;
  access?: AccessFlags;
  usage: UsageFlags;
  namespace: string;
  valueType: InputPrimitiveType;
  value: string | number | boolean | null;
}

export function isInputLiteralType(type: InputType): type is InputLiteralType {
  return type.kind === "constant";
}

export type InputDateTimeType = InputUtcDateTimeType | InputOffsetDateTimeType;

interface InputDateTimeTypeBase extends InputTypeBase {
  name: string;
  encode: DateTimeKnownEncoding;
  wireType: InputPrimitiveType;
  crossLanguageDefinitionId: string;
  baseType?: InputDateTimeType;
}

export interface InputUtcDateTimeType extends InputDateTimeTypeBase {
  kind: "utcDateTime";
}

export interface InputOffsetDateTimeType extends InputDateTimeTypeBase {
  kind: "offsetDateTime";
}

export interface InputDurationType extends InputTypeBase {
  kind: "duration";
  name: string;
  encode: DurationKnownEncoding;
  wireType: InputPrimitiveType;
  crossLanguageDefinitionId: string;
  baseType?: InputDurationType;
}

export interface InputUnionType extends InputTypeBase {
  kind: "union";
  name: string;
  variantTypes: InputType[];
  namespace: string;
}

export function isInputUnionType(type: InputType): type is InputUnionType {
  return type.kind === "union";
}

/**
 * The input model type for the CSharp emitter.
 * @beta
 */
export interface InputModelType extends InputTypeBase {
  kind: "model";
  properties: InputProperty[];
  name: string;
  crossLanguageDefinitionId: string;
  access?: AccessFlags;
  usage: UsageFlags;
  namespace: string;
  additionalProperties?: InputType;
  discriminatorValue?: string;
  discriminatedSubtypes?: Record<string, InputModelType>;
  discriminatorProperty?: InputProperty;
  baseModel?: InputModelType;
  serializationOptions: SerializationOptions;
}

export interface InputPropertyTypeBase extends DecoratedType {
  type: InputType;
  name: string;
  doc?: string;
  summary?: string;
  // apiVersions: string[];
  // onClient: boolean;
  // clientDefaultValue?: unknown;
  // isApiVersionParam: boolean;
  optional: boolean;
  crossLanguageDefinitionId: string;
  readOnly: boolean;
  access?: AccessFlags;
}

export interface InputModelProperty extends InputPropertyTypeBase {
  kind: "property";
  discriminator: boolean;
  serializedName: string;
  serializationOptions: SerializationOptions;
  flatten: boolean;
}

export type InputProperty = InputModelProperty | InputHttpParameter;

export type InputHttpParameter =
  | InputQueryParameter
  | InputPathParameter
  | InputHeaderParameter
  | InputBodyParameter;

export interface InputQueryParameter extends InputPropertyTypeBase {
  kind: "query";
  collectionFormat?: CollectionFormat;
  serializedName: string;
  correspondingMethodParams: InputProperty[];
  explode: boolean;
}

export interface InputPathParameter extends InputPropertyTypeBase {
  kind: "path";
  explode: boolean;
  style: "simple" | "label" | "matrix" | "fragment" | "path";
  allowReserved: boolean;
  serializedName: string;
  correspondingMethodParams: InputProperty[];
}

export interface InputHeaderParameter extends InputPropertyTypeBase {
  kind: "header";
  collectionFormat?: CollectionFormat;
  serializedName: string;
  correspondingMethodParams: InputProperty[];
}

export interface InputBodyParameter extends InputPropertyTypeBase {
  kind: "body";
  serializedName: string;
  contentTypes: string[];
  defaultContentType: string;
  correspondingMethodParams: InputProperty[];
}

export interface InputEnumType extends InputTypeBase {
  kind: "enum";
  name: string;
  crossLanguageDefinitionId: string;
  valueType: InputPrimitiveType;
  values: InputEnumValueType[];
  isFixed: boolean;
  isFlags: boolean;
  usage: UsageFlags;
  access?: AccessFlags;
  namespace: string;
}

export interface InputEnumValueType extends InputTypeBase {
  kind: "enumvalue";
  name: string;
  value: string | number;
  enumType: InputEnumType;
  valueType: InputPrimitiveType;
}

export interface InputNullableType extends InputTypeBase {
  kind: "nullable";
  type: InputType;
  namespace: string;
}

export interface InputArrayType extends InputTypeBase {
  kind: "array";
  name: string;
  valueType: InputType;
  crossLanguageDefinitionId: string;
}

export interface InputDictionaryType extends InputTypeBase {
  kind: "dict";
  keyType: InputType;
  valueType: InputType;
}
