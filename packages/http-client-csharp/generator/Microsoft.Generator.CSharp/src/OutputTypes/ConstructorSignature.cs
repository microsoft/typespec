﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Represents the signature of a constructor in C#.
    /// </summary>
    /// <param name="Type">The type of the constructor.</param>
    /// <param name="Summary">The summary of the constructor.</param>
    /// <param name="Description">The description of the constructor.</param>
    /// <param name="Modifiers">The modifiers of the constructor.</param>
    /// <param name="Parameters">The parameters of the constructor.</param>
    /// <param name="Attributes">The attributes of the constructor.</param>
    /// <param name="Initializer">The initializer of the constructor.</param>
    public sealed record ConstructorSignature(
        CSharpType Type,
        FormattableString? Summary,
        FormattableString? Description,
        MethodSignatureModifiers Modifiers,
        IReadOnlyList<Parameter> Parameters,
        IReadOnlyList<CSharpAttribute>? Attributes = null,
        ConstructorInitializer? Initializer = null)
        : MethodSignatureBase(Type.Name, Summary, Description, null, Modifiers, Parameters, Attributes ?? Array.Empty<CSharpAttribute>());
}
