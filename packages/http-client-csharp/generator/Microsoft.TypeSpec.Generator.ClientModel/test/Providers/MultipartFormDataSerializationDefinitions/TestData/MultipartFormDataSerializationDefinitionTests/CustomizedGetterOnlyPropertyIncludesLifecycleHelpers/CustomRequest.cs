// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(CustomValue), "customValue")]
    public partial class CustomRequest
    {
        public string CustomValue { get; } = "value";
    }
}
