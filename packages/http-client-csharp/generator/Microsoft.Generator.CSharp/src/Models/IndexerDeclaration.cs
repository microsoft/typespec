// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    internal record IndexerDeclaration(FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType PropertyType, string Name, Parameter IndexerParameter, PropertyBody PropertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions = null)
        : PropertyDeclaration(Description, Modifiers, PropertyType, Name, PropertyBody, Exceptions);
}
