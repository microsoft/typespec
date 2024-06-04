// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Providers
{
    internal class IndexerProvider : PropertyProvider
    {
        public ParameterProvider IndexerParameter { get; }
        public IndexerProvider(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType propertyType, ParameterProvider indexerParameter, PropertyBody propertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? exceptions = null, CSharpType? explicitInterface = null)
            : base(description, modifiers, propertyType, "this", propertyBody, exceptions, explicitInterface)
        {
            IndexerParameter = indexerParameter;
        }
    }
}
