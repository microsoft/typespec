// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record EnvironmentSnippets(ValueExpression Expression) : TypedSnippet(typeof(Environment), Expression)
    {
        public static StringSnippet NewLine() => new(Static(typeof(Environment)).Property(nameof(Environment.NewLine)));
    }
}
