// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public record PropertyDeclaration(FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType Type, string Name, PropertyBody Body, IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions = null, CSharpType? ExplicitInterface = null)
    {
        /// <summary>
        /// The original property description prior to any modifications.
        /// </summary>
        public string? OriginalDescription { get; internal init; }
    }
}
