// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;

namespace ModelWithConverterUsage.Models
{
    [CodeGenModel(Usage = new[] { "converter" })]
    public partial struct ModelStruct
    {
    }
}
