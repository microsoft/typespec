// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample;

internal class CustomCodeGenTypeAttribute : CodeGenTypeAttribute
{
    public CustomCodeGenTypeAttribute(string originalName) : base(originalName)
    {
    }
}

[CustomCodeGenType("Info")]
public partial class Model
{
}
