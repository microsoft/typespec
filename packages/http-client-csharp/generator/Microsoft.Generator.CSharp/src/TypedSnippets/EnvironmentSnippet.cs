// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record EnvironmentSnippet(ValueExpression Expression) : TypedSnippet(typeof(Environment), Expression)
    {
        public static StringSnippet NewLine() => new(new TypeReferenceExpression(typeof(Environment)).Property(nameof(Environment.NewLine)));
    }
}
