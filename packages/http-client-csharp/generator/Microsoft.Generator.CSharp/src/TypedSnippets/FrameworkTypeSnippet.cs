// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    /// <summary>
    /// Represents expression which has a return value of a framework type.
    /// </summary>
    public sealed record FrameworkTypeSnippet(Type FrameworkType, ValueExpression Untyped) : TypedSnippet(FrameworkType, Untyped);
}
