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
            => Provider.ToString(value);

        public static StringSnippet ToString(ValueExpression value, ValueExpression format)
            => Provider.ToString(value, format);

        public static StringSnippet ToBase64UrlString(ValueExpression value)
            => Provider.ToBase64UrlString(value);

        public static ValueExpression FromBase64UrlString(ValueExpression value)
            => Provider.FromBase64UrlString(value);

        public static DateTimeOffsetSnippet ParseDateTimeOffset(ValueExpression value, ValueExpression format)
            => Provider.ParseDateTimeOffset(value, format);

        public static TimeSpanSnippet ParseTimeSpan(ValueExpression value, ValueExpression format)
            => Provider.ParseTimeSpan(value, format);

        public static StringSnippet ConvertToString(ValueExpression value, ValueExpression? format = null)
            => Provider.ConvertToString(value, format);
    }
}
