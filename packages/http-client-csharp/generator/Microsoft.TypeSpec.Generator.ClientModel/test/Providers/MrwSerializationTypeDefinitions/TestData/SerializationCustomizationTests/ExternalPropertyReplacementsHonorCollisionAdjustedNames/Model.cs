// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class Model
    {
        [CodeGenMember("ExternalResponseProperty")]
        internal string ResponseInternal { get; set; }
    }
}
