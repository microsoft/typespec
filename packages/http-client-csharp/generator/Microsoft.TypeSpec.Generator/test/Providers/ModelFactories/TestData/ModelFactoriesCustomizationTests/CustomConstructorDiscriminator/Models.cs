// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class Derived
    {
        internal Derived(string kind, string name, IDictionary<string, BinaryData> additionalBinaryDataProperties)
            : base(kind, name, additionalBinaryDataProperties)
        {
        }
    }
}
