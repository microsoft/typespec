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

        public static ScopedApi<string> InvokeToString(this ScopedApi<DateTimeOffset> dtoExpression, ValueExpression format, ValueExpression formatProvider)
            => dtoExpression.Invoke(nameof(DateTimeOffset.ToString), [format, formatProvider]).As<string>();

        public static ScopedApi<long> ToUnixTimeSeconds(this ScopedApi<DateTimeOffset> dtoExpression)
            => dtoExpression.Invoke(nameof(DateTimeOffset.ToUnixTimeSeconds)).As<long>();

        public static ScopedApi<DateTimeOffset> ToUniversalTime(this ScopedApi<DateTimeOffset> dtoExpression)
            => dtoExpression.Invoke(nameof(DateTimeOffset.ToUniversalTime)).As<DateTimeOffset>();

        public static ScopedApi<DateTimeOffset> Parse(string s) => Parse(Literal(s));

        public static ScopedApi<DateTimeOffset> Parse(ValueExpression value)
            => Static<DateTimeOffset>().Invoke(nameof(DateTimeOffset.Parse), value).As<DateTimeOffset>();

        public static ScopedApi<DateTimeOffset> Parse(ValueExpression value, ValueExpression formatProvider, ValueExpression style)
            => Static<DateTimeOffset>().Invoke(nameof(DateTimeOffset.Parse), [value, formatProvider, style]).As<DateTimeOffset>();
    }
}
