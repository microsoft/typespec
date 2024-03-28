// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal record InputEnumTypeIntegerValue(string Name, int IntegerValue, string? Description) : InputEnumTypeValue(Name, IntegerValue, Description);
