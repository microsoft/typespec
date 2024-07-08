// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Primitives
{
    /// <summary>
    /// Represents the signature of a constructor in C#.
    /// </summary>
    /// <param name="Type">The type of the constructor.</param>
    /// <param name="Description">The description of the constructor.</param>
    /// <param name="Modifiers">The modifiers of the constructor.</param>
    /// <param name="Parameters">The parameters of the constructor.</param>
    /// <param name="Attributes">The attributes of the constructor.</param>
    /// <param name="Initializer">The initializer of the constructor.</param>
    public sealed class ConstructorSignature(
        CSharpType Type,
        FormattableString? Description,
        MethodSignatureModifiers Modifiers,
        IReadOnlyList<ParameterProvider> Parameters,
        IReadOnlyList<AttributeStatement>? Attributes = null,
        ConstructorInitializer? Initializer = null)
        : MethodSignatureBase(Type.Name, Description, null, Modifiers, Parameters, Attributes ?? Array.Empty<AttributeStatement>(), null)
    {
        public ConstructorInitializer? Initializer { get; } = Initializer;
        public CSharpType Type { get; } = Type;
    }
}
