// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSerialization(nameof(ResponseIdInternal), SerializationName = "response_id")]
    public partial class Model
    {
        internal string ResponseIdInternal { get; set; }
    }
}
