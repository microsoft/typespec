// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal class IndexPropertyProvider : PropertyProvider
    {
        private static readonly FormattableString DefaultDescription = $"Gets or sets the value associated with the specified key.";
        public ParameterProvider IndexerParameter { get; }
        public IndexPropertyProvider(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType propertyType, ParameterProvider indexerParameter, PropertyBody propertyBody, TypeProvider enclosingType, CSharpType? explicitInterface = null)
            : base(description ?? DefaultDescription, modifiers, propertyType, "this", propertyBody, enclosingType, explicitInterface)
        {
            IndexerParameter = indexerParameter;
        }
    }
}
