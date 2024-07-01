// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record EnumerableSnippet(CSharpType ItemType, ValueExpression Expression) : TypedSnippet(new CSharpType(typeof(IEnumerable<>), false, ItemType), Expression)
    {
        public BoolSnippet Any() => new(new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.Any), new[] { Expression }, CallAsExtension: true));
        public EnumerableSnippet Select(TypedSnippet selector) => new(selector.Type, new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.Select), new[] { Expression, selector }, CallAsExtension: true));
    }
}
