// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class TestModel
    {
        public TestModel(string name, IDictionary<string, object> additionalProperties)
        {
            Name = name;
            AdditionalProperties = additionalProperties;
        }

        public string Name { get; set; }
        public IDictionary<string, object> AdditionalProperties { get; }
    }
}
