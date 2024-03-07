// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models
{
    internal record ConstructorSignature(CSharpType Type, FormattableString? Summary, FormattableString? Description, MethodSignatureModifiers Modifiers, IReadOnlyList<Parameter> Parameters, IReadOnlyList<CSharpAttribute>? Attributes = null, ConstructorInitializer? Initializer = null)
        : MethodSignatureBase(Type.Name, Summary, Description, null, Modifiers, Parameters, Attributes ?? Array.Empty<CSharpAttribute>());
}
