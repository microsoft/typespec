// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class DateTimeOffsetSnippets
    {
        public static ScopedApi<DateTimeOffset> Now => Static<DateTimeOffset>().Property(nameof(DateTimeOffset.Now)).As<DateTimeOffset>();
        public static ScopedApi<DateTimeOffset> UtcNow => Static<DateTimeOffset>().Property(nameof(DateTimeOffset.UtcNow)).As<DateTimeOffset>();

        public static ScopedApi<DateTimeOffset> FromUnixTimeSeconds(ValueExpression expression)
            => Static<DateTimeOffset>().Invoke(nameof(DateTimeOffset.FromUnixTimeSeconds), expression).As<DateTimeOffset>();

        public static StringSnippet InvokeToString(this ScopedApi<DateTimeOffset> dtoExpression, StringSnippet format, ValueExpression formatProvider)
            => new(dtoExpression.Invoke(nameof(DateTimeOffset.ToString), [format, formatProvider]));

        public static LongSnippet ToUnixTimeSeconds(this ScopedApi<DateTimeOffset> dtoExpression)
            => new(dtoExpression.Invoke(nameof(DateTimeOffset.ToUnixTimeSeconds)));

        public static ScopedApi<DateTimeOffset> ToUniversalTime(this ScopedApi<DateTimeOffset> dtoExpression)
            => new(dtoExpression.Invoke(nameof(DateTimeOffset.ToUniversalTime)));

        public static ScopedApi<DateTimeOffset> Parse(string s) => Parse(Literal(s));

        public static ScopedApi<DateTimeOffset> Parse(ValueExpression value)
            => Static<DateTimeOffset>().Invoke(nameof(DateTimeOffset.Parse), value).As<DateTimeOffset>();

        public static ScopedApi<DateTimeOffset> Parse(ValueExpression value, ValueExpression formatProvider, ValueExpression style)
            => Static<DateTimeOffset>().Invoke(nameof(DateTimeOffset.Parse), [value, formatProvider, style]).As<DateTimeOffset>();
    }
}
