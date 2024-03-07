// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputEnumTypeValue } from "./inputEnumTypeValue.js";
import { InputIntrinsicTypeKind } from "./inputIntrinsicTypeKind.js";
import { InputModelProperty } from "./inputModelProperty.js";
import { InputPrimitiveTypeKind } from "./inputPrimitiveTypeKind.js";
import { InputTypeKind } from "./inputTypeKind.js";

export interface InputType {
    Name: string;
    Kind: InputTypeKind;
    IsNullable: boolean;
}

export interface InputPrimitiveType extends InputType {
    Name: InputPrimitiveTypeKind;
}

export interface InputLiteralType extends InputType {
    Kind: InputTypeKind.Literal;
    Name: InputTypeKind.Literal; // literal type does not really have a name right now, we just use its kind
    LiteralValueType: InputType;
    Value: any;
}

export function isInputLiteralType(type: InputType): type is InputLiteralType {
    return type.Kind === InputTypeKind.Literal;
}

export interface InputUnionType extends InputType {
    Kind: InputTypeKind.Union;
    Name: InputTypeKind.Union; // union type does not really have a name right now, we just use its kind
    UnionItemTypes: InputType[];
}

export function isInputUnionType(type: InputType): type is InputUnionType {
    return type.Kind === InputTypeKind.Union;
}

export interface InputModelType extends InputType {
    Kind: InputTypeKind.Model;
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

export interface InputEnumType extends InputType {
    Kind: InputTypeKind.Enum;
    Name: string;
    EnumValueType: string;
    AllowedValues: InputEnumTypeValue[];
    Namespace?: string;
    Accessibility?: string;
    Deprecated?: string;
    Description?: string;
    IsExtensible: boolean;
    Usage: string;
}

export function isInputEnumType(type: InputType): type is InputEnumType {
    return type.Kind === InputTypeKind.Enum;
}

export interface InputListType extends InputType {
    Kind: InputTypeKind.Array;
    Name: InputTypeKind.Array; // array type does not really have a name right now, we just use its kind
    ElementType: InputType;
}

export function isInputListType(type: InputType): type is InputListType {
    return type.Kind === InputTypeKind.Array;
}

export interface InputDictionaryType extends InputType {
    Kind: InputTypeKind.Dictionary;
    Name: InputTypeKind.Dictionary; // dictionary type does not really have a name right now, we just use its kind
    KeyType: InputType;
    ValueType: InputType;
}

export function isInputDictionaryType(
    type: InputType
): type is InputDictionaryType {
    return type.Kind === InputTypeKind.Dictionary;
}

export interface InputIntrinsicType extends InputType {
    Kind: InputTypeKind.Intrinsic;
    Name: InputIntrinsicTypeKind;
    IsNullable: false;
}

export function isInputIntrinsicType(
    type: InputType
): type is InputIntrinsicType {
    return type.Kind === InputTypeKind.Intrinsic;
}
