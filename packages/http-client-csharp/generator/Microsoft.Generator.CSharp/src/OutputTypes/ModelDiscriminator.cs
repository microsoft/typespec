// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public class ModelDiscriminator(PropertyProvider discriminatorProperty, string discriminatorSerializedName, IReadOnlyDictionary<LiteralExpression, ModelProvider> implementations, LiteralExpression? discriminatorValue)
    {
        public PropertyProvider DiscriminatorProperty { get; } = discriminatorProperty;

        public string DiscriminatorSerializedName { get; } = discriminatorSerializedName;

        public IReadOnlyDictionary<LiteralExpression, ModelProvider> Implementations { get; } = implementations;

        public LiteralExpression? DiscriminatorValue { get; } = discriminatorValue;
    }
}
