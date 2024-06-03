// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    internal class IndexerDeclaration : PropertyDeclaration
    {
        public Parameter IndexerParameter { get; }
        public IndexerDeclaration(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType propertyType, Parameter indexerParameter, PropertyBody propertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? exceptions = null, CSharpType? explicitInterface = null)
            : base(description, modifiers, propertyType, "this", propertyBody, exceptions, explicitInterface)
        {
            IndexerParameter = indexerParameter;
        }
    }
}
