// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class TimeSpanSnippets
    {
        public static ScopedApi<string> InvokeToString(this ScopedApi<TimeSpan> timespanExpression, string? format) => timespanExpression.Invoke(nameof(TimeSpan.ToString), [Snippet.Literal(format)]).As<string>();
        public static ScopedApi<string> InvokeToString(this ScopedApi<TimeSpan> timespanExpression, ValueExpression format, ValueExpression formatProvider)
            => timespanExpression.Invoke(nameof(TimeSpan.ToString), [format, formatProvider]).As<string>();

        public static ScopedApi<TimeSpan> FromSeconds(ValueExpression value) => Static<TimeSpan>().Invoke(nameof(TimeSpan.FromSeconds), value).As<TimeSpan>();

        public static ScopedApi<TimeSpan> FromMilliseconds(ValueExpression value) => Static<TimeSpan>().Invoke(nameof(TimeSpan.FromMilliseconds), value).As<TimeSpan>();

        public static ScopedApi<TimeSpan> ParseExact(ValueExpression value, ValueExpression format, ValueExpression formatProvider)
            => Static<TimeSpan>().Invoke(nameof(TimeSpan.ParseExact), [value, format, formatProvider]).As<TimeSpan>();

        public static ScopedApi<double> TotalSeconds(this ScopedApi<TimeSpan> timespanExpression) => timespanExpression.Property(nameof(TimeSpan.TotalSeconds)).As<double>();

        public static ScopedApi<double> TotalMilliseconds(this ScopedApi<TimeSpan> timespanExpression) => timespanExpression.Property(nameof(TimeSpan.TotalMilliseconds)).As<double>();
    }
}
