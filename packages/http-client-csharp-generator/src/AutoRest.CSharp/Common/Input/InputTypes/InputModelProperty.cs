// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace AutoRest.CSharp.Common.Input;

internal record InputModelProperty(string Name, string SerializedName, string Description, InputType Type, bool IsRequired, bool IsReadOnly, bool IsDiscriminator)
{
    public FormattableString? DefaultValue { get; init; }
}
