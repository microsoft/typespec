// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record EnumerableSnippet(CSharpType ItemType, ValueExpression Untyped) : TypedSnippet(new CSharpType(typeof(IEnumerable<>), false, ItemType), Untyped)
    {
        public BoolSnippet Any() => new(new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.Any), new[] { Untyped }, CallAsExtension: true));
        public EnumerableSnippet Select(TypedSnippet selector) => new(selector.Type, new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.Select), new[] { Untyped, selector }, CallAsExtension: true));
    }
}
