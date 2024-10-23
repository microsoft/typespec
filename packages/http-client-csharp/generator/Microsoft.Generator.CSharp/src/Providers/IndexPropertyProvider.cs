// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Providers
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
