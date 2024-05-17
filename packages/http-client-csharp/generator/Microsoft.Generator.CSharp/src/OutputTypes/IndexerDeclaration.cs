// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    internal record IndexerDeclaration(FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType PropertyType, Parameter IndexerParameter, PropertyBody PropertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions = null, CSharpType? ExplicitInterface = null)
        : PropertyDeclaration(Description, Modifiers, PropertyType, "this", PropertyBody, Exceptions, ExplicitInterface); // the name of an indexer is always "this"
}
