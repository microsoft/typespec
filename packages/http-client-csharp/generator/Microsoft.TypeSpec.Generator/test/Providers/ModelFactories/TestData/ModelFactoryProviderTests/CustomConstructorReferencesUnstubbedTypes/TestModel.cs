// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSuppress("TestModel", typeof(IDictionary<string, BinaryData>))]
    public partial class TestModel
    {
        internal TestModel(IDictionary<string, ToolConfig> toolConfigs, ExecutionType executionType, ExecutionType? optionalExecutionType, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
        }
    }
}
