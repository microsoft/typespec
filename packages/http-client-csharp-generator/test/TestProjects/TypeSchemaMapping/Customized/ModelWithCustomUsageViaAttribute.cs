// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;

namespace TypeSchemaMapping.Models
{
    [CodeGenModel(Formats = new[] { "xml", "json" }, Usage = new[]{"input", "output", "model"})]
    public partial class ModelWithCustomUsageViaAttribute
    {

    }
}
