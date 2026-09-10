// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample;

[CodeGenType("Info")]
public partial class Model
{
    [CodeGenMember("message")]
    public string Message { get; }
}
