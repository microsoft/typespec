// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class Model
    {
        [CodeGenMember("ipFoo")]
        internal string IPFooInternal { get; set; }

        [CodeGenMember("createdAt")]
        internal DateTimeOffset? CreatedOnInternal { get; set; }
    }
}
