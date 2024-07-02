// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ModelSerializationExtensionsSnippet(ValueExpression Expression) : TypedSnippet<ModelSerializationExtensionsProvider>(Expression)
    {
        private const string WriteStringValueMethodName = "WriteStringValue";
        private const string WriteBase64StringValueMethodName = "WriteBase64StringValue";
        private const string WriteNumberValueMethodName = "WriteNumberValue";
        private const string WriteObjectValueMethodName = "WriteObjectValue";
        private const string GetCharMethodName = "GetChar";
        private const string GetObjectMethodName = "GetObject";
        private const string GetBytesFromBase64MethodName = "GetBytesFromBase64";
        private const string GetDateTimeOffsetMethodName = "GetDateTimeOffset";
        private const string GetTimeSpanMethodName = "GetTimeSpan";
        private const string ThrowNonNullablePropertyIsNullMethodName = "ThrowNonNullablePropertyIsNull";
        private const string GetRequiredStringMethodName = "GetRequiredString";

        private static ModelSerializationExtensionsProvider? _provider;
        private static ModelSerializationExtensionsProvider Provider => _provider ??= new();

        public static readonly ModelReaderWriterOptionsSnippet Wire = Provider.WireOptions;

        public static MethodBodyStatement WriteObjectValue(Utf8JsonWriterSnippet snippet, TypedSnippet value, ValueExpression? options = null)
        {
            var parameters = options is null
                ? new ValueExpression[] { value }
                : new ValueExpression[] { value, options };
            return snippet.Expression.Invoke(WriteObjectValueMethodName, parameters, [value.Type], false).Terminate();
        }

        public static MethodBodyStatement WriteStringValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => snippet.Invoke(WriteStringValueMethodName, [value, Literal(format)]).Terminate();

        public static MethodBodyStatement WriteNumberValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => snippet.Invoke(WriteNumberValueMethodName, [value, Literal(format)]).Terminate();

        public static MethodBodyStatement WriteBase64StringValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => snippet.Invoke(WriteBase64StringValueMethodName, [value, Literal(format)]).Terminate();

        public static ValueExpression GetObject(JsonElementSnippet element)
            => new InvokeStaticMethodExpression(Provider.Type, GetObjectMethodName, [element], CallAsExtension: true);

        public static ValueExpression GetBytesFromBase64(JsonElementSnippet element, string? format)
            => new InvokeStaticMethodExpression(Provider.Type, GetBytesFromBase64MethodName, [element, Literal(format)], CallAsExtension: true);

        public static ValueExpression GetDateTimeOffset(JsonElementSnippet element, string? format)
            => new InvokeStaticMethodExpression(Provider.Type, GetDateTimeOffsetMethodName, [element, Literal(format)], CallAsExtension: true);

        public static ValueExpression GetTimeSpan(JsonElementSnippet element, string? format)
            => new InvokeStaticMethodExpression(Provider.Type, GetTimeSpanMethodName, [element, Literal(format)], CallAsExtension: true);

        public static ValueExpression GetChar(JsonElementSnippet element)
            => new InvokeStaticMethodExpression(Provider.Type, GetCharMethodName, [element], CallAsExtension: true);

        public static MethodBodyStatement ThrowNonNullablePropertyIsNull(JsonPropertySnippet property)
            => property.Invoke(ThrowNonNullablePropertyIsNullMethodName).Terminate();

        public static ValueExpression GetRequiredString(JsonElementSnippet element)
            => new InvokeStaticMethodExpression(Provider.Type, GetRequiredStringMethodName, [element], CallAsExtension: true);
    }
}
