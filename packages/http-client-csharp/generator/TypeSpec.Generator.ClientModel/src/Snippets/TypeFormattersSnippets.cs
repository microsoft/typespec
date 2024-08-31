// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using TypeSpec.Generator.ClientModel.Providers;
using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Providers;
using TypeSpec.Generator.Snippets;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class TypeFormattersSnippets
    {
        private const string ToStringMethodName = "ToString";
        private const string ToBase64UrlStringMethodName = "ToBase64UrlString";
        private const string FromBase64UrlStringMethodName = "FromBase64UrlString";
        private const string ParseDateTimeOffsetMethodName = "ParseDateTimeOffset";
        private const string ParseTimeSpanMethodName = "ParseTimeSpan";
        private const string ConvertToStringMethodName = "ConvertToString";

        public static ScopedApi<string> ToString(ValueExpression value)
            => Static<TypeFormattersDefinition>().Invoke(ToStringMethodName, value).As<string>();

        public static ScopedApi<string> ToString(ValueExpression value, ValueExpression format)
            => Static<TypeFormattersDefinition>().Invoke(ToStringMethodName, [value, format]).As<string>();

        public static ScopedApi<string> ToBase64UrlString(this ScopedApi<byte[]> value)
            => Static<TypeFormattersDefinition>().Invoke(ToBase64UrlStringMethodName, value).As<string>();

        public static ValueExpression FromBase64UrlString(this ScopedApi<string> value)
            => Static<TypeFormattersDefinition>().Invoke(FromBase64UrlStringMethodName, value);

        public static ScopedApi<DateTimeOffset> ParseDateTimeOffset(this ScopedApi<string> value, ValueExpression format)
            => Static<TypeFormattersDefinition>().Invoke(ParseDateTimeOffsetMethodName, [value, format]).As<DateTimeOffset>();

        public static ScopedApi<TimeSpan> ParseTimeSpan(this ScopedApi<string> value, ValueExpression format)
            => Static<TypeFormattersDefinition>().Invoke(ParseTimeSpanMethodName, [value, format]).As<TimeSpan>();

        public static ScopedApi<string> ConvertToString(this ValueExpression value, ValueExpression? format = null)
        {
            var arguments = format != null
                ? new[] { value, format }
                : [value];
            return Static<TypeFormattersDefinition>().Invoke(ConvertToStringMethodName, arguments).As<string>();
        }

        public static ScopedApi<string> ConvertToString(this ParameterProvider value, ValueExpression? format = null)
        {
            var arguments = format != null
                ? new[] { value, format }
                : [value];
            return Static<TypeFormattersDefinition>().Invoke(ConvertToStringMethodName, arguments).As<string>();
        }
    }
}
