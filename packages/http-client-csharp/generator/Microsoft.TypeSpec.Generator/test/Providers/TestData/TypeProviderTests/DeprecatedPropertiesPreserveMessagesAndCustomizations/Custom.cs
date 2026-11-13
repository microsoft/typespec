// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample
{
    [CodeGenType("CustomOptions")]
    public partial class RenamedOptions
    {
        [Obsolete("Handwritten message")]
        public string Handwritten { get; set; }
    }
}
