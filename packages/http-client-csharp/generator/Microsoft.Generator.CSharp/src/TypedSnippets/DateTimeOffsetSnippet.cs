// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record DateTimeOffsetSnippet(ValueExpression Untyped) : TypedSnippet<DateTimeOffset>(Untyped)
    {
        public static DateTimeOffsetSnippet Now => new(StaticProperty(nameof(DateTimeOffset.Now)));
        public static DateTimeOffsetSnippet UtcNow => new(StaticProperty(nameof(DateTimeOffset.UtcNow)));

        public static DateTimeOffsetSnippet FromUnixTimeSeconds(ValueExpression expression)
            => new(InvokeStatic(nameof(DateTimeOffset.FromUnixTimeSeconds), expression));

        public StringSnippet InvokeToString(StringSnippet format, ValueExpression formatProvider)
            => new(Untyped.Invoke(nameof(DateTimeOffset.ToString), new[] { format, formatProvider }));

        public LongSnippet ToUnixTimeSeconds()
            => new(Untyped.Invoke(nameof(DateTimeOffset.ToUnixTimeSeconds)));

        public DateTimeOffsetSnippet ToUniversalTime()
            => new(Untyped.Invoke(nameof(DateTimeOffset.ToUniversalTime)));

        public static DateTimeOffsetSnippet Parse(string s) => Parse(Snippet.Literal(s));

        public static DateTimeOffsetSnippet Parse(ValueExpression value)
            => new(InvokeStatic(nameof(DateTimeOffset.Parse), value));

        public static DateTimeOffsetSnippet Parse(ValueExpression value, ValueExpression formatProvider, ValueExpression style)
            => new(InvokeStatic(nameof(DateTimeOffset.Parse), new[] { value, formatProvider, style }));
    }
}
