// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public record PropertyDeclaration(FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType PropertyType, CodeWriterDeclaration Declaration, PropertyBody PropertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions = null, CSharpType? ExplicitInterface = null)
    {
        public PropertyDeclaration(FormattableString? description, MethodSignatureModifiers modifiers, CSharpType propertyType, string name, PropertyBody propertyBody, IReadOnlyDictionary<CSharpType, FormattableString>? exceptions = null, CSharpType? explicitInterface = null) : this(description, modifiers, propertyType, new CodeWriterDeclaration(name), propertyBody, exceptions, explicitInterface)
        {
            Declaration.SetActualName(name);
        }
    }
}
