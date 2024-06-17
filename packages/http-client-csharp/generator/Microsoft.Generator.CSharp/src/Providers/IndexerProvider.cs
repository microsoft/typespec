// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Providers
{
    internal class IndexerProvider : PropertyProvider
    {
        public ParameterProvider IndexerParameter { get; }
        public IndexerProvider(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType propertyType, ParameterProvider indexerParameter, PropertyBody propertyBody, CSharpType? explicitInterface = null)
            : base(description, modifiers, propertyType, "this", propertyBody, explicitInterface)
        {
            IndexerParameter = indexerParameter;
        }
    }
}
