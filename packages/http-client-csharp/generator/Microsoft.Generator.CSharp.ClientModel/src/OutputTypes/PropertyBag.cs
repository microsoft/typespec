// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal class PropertyBag
    {
        public Dictionary<string, PropertyBag> Bag { get; } = new();
    }
}
