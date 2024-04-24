// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public record PropertyDeclaration(FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType PropertyType, string Name, PropertyBody PropertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions = null, CSharpType? ExplicitInterface = null);
}
