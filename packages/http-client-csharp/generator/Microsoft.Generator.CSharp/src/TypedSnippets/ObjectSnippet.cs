// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.TypedSnippets
{
    public sealed record ObjectSnippet(ValueExpression Untyped) : TypedSnippet<object>(Untyped)
    {
    }
}
