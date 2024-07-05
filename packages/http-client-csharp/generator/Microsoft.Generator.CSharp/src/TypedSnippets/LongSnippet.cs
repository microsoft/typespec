// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record LongSnippet(ValueExpression Expression) : TypedSnippet<long>(Expression)
    {
        public StringSnippet InvokeToString(ValueExpression formatProvider)
            => new(Expression.Invoke(nameof(long.ToString), formatProvider));

        public static LongSnippet Parse(StringSnippet value, ValueExpression formatProvider)
            => new(new InvokeStaticMethodExpression(typeof(long), nameof(long.Parse), new[] { value, formatProvider }));
    }
}
