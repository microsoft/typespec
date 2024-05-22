// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EnumerableExpression(CSharpType ItemType, ValueExpression Untyped) : TypedValueExpression(new CSharpType(typeof(IEnumerable<>), false, ItemType), Untyped)
    {
        public BoolExpression Any() => new(new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.Any), new[] { Untyped }, CallAsExtension: true));
        public EnumerableExpression Select(TypedFuncExpression selector) => new(selector.Inner.Type, new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.Select), new[] { Untyped, selector }, CallAsExtension: true));
    }
}
