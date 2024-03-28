// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal record InputEnumTypeStringValue(string Name, string StringValue, string? Description) : InputEnumTypeValue(Name, StringValue, Description);
