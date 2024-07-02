// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record TypeFormattersSnippet(ValueExpression Expression) : TypedSnippet<TypeFormattersProvider>(Expression)
    {
        private const string ToStringMethodName = "ToString";
        private const string ToBase64UrlStringMethodName = "ToBase64UrlString";
        private const string FromBase64UrlStringMethodName = "FromBase64UrlString";
        private const string ParseDateTimeOffsetMethodName = "ParseDateTimeOffset";
        private const string ParseTimeSpanMethodName = "ParseTimeSpan";
        private const string ConvertToStringMethodName = "ConvertToString";

        private static TypeFormattersProvider? _provider;
        private static TypeFormattersProvider Provider => _provider ??= new();

        public static ScopedApi<string> ToString(ValueExpression value)
            => new(new InvokeStaticMethodExpression(Provider.Type, ToStringMethodName, [value]));

        public static ScopedApi<string> ToString(ValueExpression value, ValueExpression format)
            => new(new InvokeStaticMethodExpression(Provider.Type, ToStringMethodName, [value, format]));

        public static ScopedApi<string> ToBase64UrlString(ValueExpression value)
            => new(new InvokeStaticMethodExpression(Provider.Type, ToBase64UrlStringMethodName, [value]));

        public static ValueExpression FromBase64UrlString(ValueExpression value)
            => new InvokeStaticMethodExpression(Provider.Type, FromBase64UrlStringMethodName, [value]);

        public static ScopedApi<DateTimeOffset> ParseDateTimeOffset(ValueExpression value, ValueExpression format)
            => new(new InvokeStaticMethodExpression(Provider.Type, ParseDateTimeOffsetMethodName, [value, format]));

        public static ScopedApi<TimeSpan> ParseTimeSpan(ValueExpression value, ValueExpression format)
            => new(new InvokeStaticMethodExpression(Provider.Type, ParseTimeSpanMethodName, [value, format]));

        public static ScopedApi<string> ConvertToString(ValueExpression value, ValueExpression? format = null)
        {
            var arguments = format != null
                ? new[] { value, format }
                : new[] { value };
            return new(new InvokeStaticMethodExpression(Provider.Type, ConvertToStringMethodName, arguments));
        }
    }
}
