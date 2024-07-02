// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record TimeSpanSnippet(ValueExpression Expression) : TypedSnippet<TimeSpan>(Expression)
    {
        public ScopedApi<string> InvokeToString(string? format) => Expression.Invoke(nameof(TimeSpan.ToString), [Snippet.Literal(format)]).As<string>();
        public ScopedApi<string> InvokeToString(ValueExpression format, ValueExpression formatProvider)
            => Expression.Invoke(nameof(TimeSpan.ToString), [format, formatProvider]).As<string>();

        public static TimeSpanSnippet FromSeconds(ValueExpression value) => new(InvokeStatic(nameof(TimeSpan.FromSeconds), value));

        public static TimeSpanSnippet ParseExact(ValueExpression value, ValueExpression format, ValueExpression formatProvider)
            => new(new InvokeStaticMethodExpression(typeof(TimeSpan), nameof(TimeSpan.ParseExact), new[] { value, format, formatProvider }));
    }
}
