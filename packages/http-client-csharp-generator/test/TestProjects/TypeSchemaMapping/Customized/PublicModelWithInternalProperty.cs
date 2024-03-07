// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Azure.Core;

namespace TypeSchemaMapping.Models
{
    public partial class PublicModelWithInternalProperty
    {
        [CodeGenMember("InternalProperty")]
        internal JsonElement StringPropertyJson { get; }
    }
}
