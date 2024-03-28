// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal record InputDictionaryType(string Name, InputType KeyType, InputType ValueType, bool IsNullable) : InputType(Name, IsNullable) { }
