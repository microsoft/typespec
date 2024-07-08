// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Primitives
{
    public class ModelDiscriminator(PropertyProvider discriminatorProperty, string discriminatorSerializedName, IReadOnlyDictionary<string, CSharpType> implementations, string? discriminatorValue)
    {
        public PropertyProvider DiscriminatorProperty { get; } = discriminatorProperty;

        public string DiscriminatorSerializedName { get; } = discriminatorSerializedName;

        public IReadOnlyDictionary<string, CSharpType> Implementations { get; } = implementations;

        public string? DiscriminatorValue { get; } = discriminatorValue;
    }
}
