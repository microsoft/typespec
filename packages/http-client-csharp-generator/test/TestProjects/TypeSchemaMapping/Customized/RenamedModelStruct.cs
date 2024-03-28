// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Azure;
using Azure.Core;

namespace CustomNamespace
{
#pragma warning disable CS0282 // ignore struct ordering warning
    [CodeGenModel("ModelStruct")]
    internal partial struct RenamedModelStruct
    {
        [CodeGenMember("ModelProperty")]
        private string CustomizedFlattenedStringProperty { get; }
    }
}
