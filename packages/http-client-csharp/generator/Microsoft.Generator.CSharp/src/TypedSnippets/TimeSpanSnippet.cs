// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record TimeSpanSnippet(ValueExpression Expression) : TypedSnippet<TimeSpan>(Expression)
    {
        public StringSnippet InvokeToString(string? format) => new(Expression.Invoke(nameof(TimeSpan.ToString), [Snippet.Literal(format)]));
        public StringSnippet InvokeToString(ValueExpression format, ValueExpression formatProvider)
            => new(Expression.Invoke(nameof(TimeSpan.ToString), new[] { format, formatProvider }));

        public static TimeSpanSnippet FromSeconds(ValueExpression value) => new(InvokeStatic(nameof(TimeSpan.FromSeconds), value));

        public static TimeSpanSnippet ParseExact(ValueExpression value, ValueExpression format, ValueExpression formatProvider)
            => new(new InvokeStaticMethodExpression(typeof(TimeSpan), nameof(TimeSpan.ParseExact), new[] { value, format, formatProvider }));
    }
}
