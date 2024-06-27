// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record ObjectSnippet(ValueExpression Untyped) : TypedSnippet<object>(Untyped)
    {
    }
}
