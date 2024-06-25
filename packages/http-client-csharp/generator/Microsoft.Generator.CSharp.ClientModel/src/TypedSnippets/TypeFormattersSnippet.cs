// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record TypeFormattersSnippet(ValueExpression Untyped) : TypedSnippet<TypeFormattersProvider>(Untyped)
    {
        private static TypeFormattersProvider? _provider;
        private static TypeFormattersProvider Provider => _provider ??= new();

        public static StringSnippet ToString(ValueExpression value)
            => new(new InvokeStaticMethodExpression(Provider.Type, TypeFormattersProvider.ToStringMethodName, new[] { value }));

        public static StringSnippet ToString(ValueExpression value, ValueExpression format)
            => new(new InvokeStaticMethodExpression(Provider.Type, TypeFormattersProvider.ToStringMethodName, new[] { value, format }));

        public static StringSnippet ToBase64UrlString(ValueExpression value)
            => new(new InvokeStaticMethodExpression(Provider.Type, TypeFormattersProvider.ToBase64UrlStringMethodName, new[] { value }));

        public static ValueExpression FromBase64UrlString(ValueExpression value)
            => new InvokeStaticMethodExpression(Provider.Type, TypeFormattersProvider.FromBase64UrlStringMethodName, new[] { value });

        public static DateTimeOffsetSnippet ParseDateTimeOffset(ValueExpression value, ValueExpression format)
            => new(new InvokeStaticMethodExpression(Provider.Type, TypeFormattersProvider.ParseDateTimeOffsetMethodName, new[] { value, format }));

        public static TimeSpanSnippet ParseTimeSpan(ValueExpression value, ValueExpression format)
            => new(new InvokeStaticMethodExpression(Provider.Type, TypeFormattersProvider.ParseTimeSpanMethodName, new[] { value, format }));

        public static StringSnippet ConvertToString(ValueExpression value, ValueExpression? format = null)
        {
            var arguments = format != null
                ? new[] { value, format }
                : new[] { value };
            return new(new InvokeStaticMethodExpression(Provider.Type, TypeFormattersProvider.ConvertToStringMethodName, arguments));
        }
    }
}
