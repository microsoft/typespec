// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record DoubleSnippet(ValueExpression Expression) : TypedSnippet<double>(Expression)
    {
        public static DoubleSnippet MaxValue => new(StaticProperty(nameof(double.MaxValue)));

        public static BoolSnippet IsNan(ValueExpression d) => new(new InvokeStaticMethodExpression(typeof(double), nameof(double.IsNaN), new[] { d }));
    }
}
