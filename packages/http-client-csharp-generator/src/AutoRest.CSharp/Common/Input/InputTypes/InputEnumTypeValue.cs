// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal record InputEnumTypeValue(string Name, object Value, string? Description)
{
    public virtual string GetJsonValueString() => GetValueString();
    public string GetValueString() => (Value.ToString() ?? string.Empty);
}
