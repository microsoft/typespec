// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { SdkBuiltInKinds } from "@azure-tools/typespec-client-generator-core";
import { DateTimeKnownEncoding, DurationKnownEncoding } from "@typespec/compiler";
import { InputEnumTypeValue } from "./input-enum-type-value.js";
import { InputModelProperty } from "./input-model-property.js";
import { InputTypeKind } from "./input-type-kind.js";

interface InputTypeBase {
  Kind: string;
  IsNullable: boolean;
  Description?: string;
}

export type InputType =
  | InputPrimitiveType
  | InputDateTimeType
  | InputDurationType
  | InputLiteralType
  | InputUnionType
  | InputModelType
  | InputEnumType
  | InputListType
  | InputDictionaryType;

export interface InputPrimitiveType extends InputTypeBase {
  Kind: SdkBuiltInKinds;
  Encode?: string; // In TCGC this is required, and when there is no encoding, it just has the same value as kind
}

export interface InputLiteralType extends InputTypeBase {
  Kind: "constant";
  ValueType: InputPrimitiveType | InputEnumType; // this has to be inconsistent because currently we have possibility of having an enum underlying the literal type
  Value: string | number | boolean | null;
}

export function isInputLiteralType(type: InputType): type is InputLiteralType {
  return type.Kind === "constant";
}

export type InputDateTimeType = InputUtcDateTimeType | InputOffsetDateTimeType;

interface InputDateTimeTypeBase extends InputTypeBase {
  Encode: DateTimeKnownEncoding;
  WireType: InputPrimitiveType;
}

export interface InputUtcDateTimeType extends InputDateTimeTypeBase {
  Kind: "utcDateTime";
}

export interface InputOffsetDateTimeType extends InputDateTimeTypeBase {
  Kind: "offsetDateTime";
}

export interface InputDurationType extends InputTypeBase {
  Kind: "duration";
  Encode: DurationKnownEncoding;
  WireType: InputPrimitiveType;
}

export interface InputUnionType extends InputTypeBase {
  Kind: "union";
  Name: string;
  VariantTypes: InputType[];
}

export function isInputUnionType(type: InputType): type is InputUnionType {
  return type.Kind === "union";
}

export interface InputModelType extends InputTypeBase {
  Kind: InputTypeKind.Model; // TODO -- will change to TCGC value in future refactor
  Name: string;
  Namespace?: string;
  Accessibility?: string;
  Deprecated?: string;
  Description?: string;
  Usage: string;
  Properties: InputModelProperty[];
  BaseModel?: InputModelType;
  DiscriminatorPropertyName?: string;
  DiscriminatorValue?: string;
  DerivedModels?: InputModelType[];
  InheritedDictionaryType?: InputDictionaryType;
}

export function isInputModelType(type: InputType): type is InputModelType {
  return type.Kind === InputTypeKind.Model;
}

export interface InputEnumType extends InputTypeBase {
  Kind: "enum";
  Name: string;
  ValueType: InputPrimitiveType;
  Values: InputEnumTypeValue[];
  Namespace?: string;
  Accessibility?: string;
  Deprecated?: string;
  IsExtensible: boolean;
  Usage: string;
}

export function isInputEnumType(type: InputType): type is InputEnumType {
  return type.Kind === "enum";
}

export interface InputListType extends InputTypeBase {
  Kind: InputTypeKind.Array; // TODO -- will change to TCGC value in future refactor
  Name: InputTypeKind.Array; // array type does not really have a name right now, we just use its kind
  ElementType: InputType;
}

export function isInputListType(type: InputType): type is InputListType {
  return type.Kind === InputTypeKind.Array;
}

export interface InputDictionaryType extends InputTypeBase {
  Kind: InputTypeKind.Dictionary; // TODO -- will change to TCGC value in future refactor
  Name: InputTypeKind.Dictionary; // dictionary type does not really have a name right now, we just use its kind
  KeyType: InputType;
  ValueType: InputType;
}

export function isInputDictionaryType(type: InputType): type is InputDictionaryType {
  return type.Kind === InputTypeKind.Dictionary;
}
