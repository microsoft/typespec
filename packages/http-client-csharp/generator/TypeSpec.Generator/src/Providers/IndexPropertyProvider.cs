// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using TypeSpec.Generator.Primitives;

namespace TypeSpec.Generator.Providers
{
    internal class IndexPropertyProvider : PropertyProvider
    {
        public ParameterProvider IndexerParameter { get; }
        public IndexPropertyProvider(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType propertyType, ParameterProvider indexerParameter, PropertyBody propertyBody, TypeProvider enclosingType, CSharpType? explicitInterface = null)
            : base(description, modifiers, propertyType, "this", propertyBody, enclosingType, explicitInterface)
        {
            IndexerParameter = indexerParameter;
        }
    }
}
