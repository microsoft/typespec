// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ModelSerializationExtensionsSnippet(ValueExpression Untyped) : TypedSnippet<ModelSerializationExtensionsProvider>(Untyped)
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
                ? new ValueExpression[] { snippet, value }
                : new ValueExpression[] { snippet, value, options };
            return new InvokeStaticMethodStatement(Provider.Type, WriteObjectValueMethodName, parameters, callAsExtension: true, typeArguments: [value.Type]);
        }

        public static MethodBodyStatement WriteStringValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Provider.Type, WriteStringValueMethodName, new[] { snippet, value, Literal(format) }, callAsExtension: true);

        public static MethodBodyStatement WriteNumberValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Provider.Type, WriteNumberValueMethodName, new[] { snippet, value, Literal(format) }, callAsExtension: true);

        public static MethodBodyStatement WriteBase64StringValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Provider.Type, WriteBase64StringValueMethodName, new[] { snippet, value, Literal(format) }, callAsExtension: true);

        public static ValueExpression GetObject(JsonElementSnippet element)
            => new InvokeStaticMethodExpression(Provider.Type, GetObjectMethodName, new ValueExpression[] { element }, CallAsExtension: true);

        public static ValueExpression GetBytesFromBase64(JsonElementSnippet element, string? format)
            => new InvokeStaticMethodExpression(Provider.Type, GetBytesFromBase64MethodName, new ValueExpression[] { element, Literal(format) }, CallAsExtension: true);

        public static ValueExpression GetDateTimeOffset(JsonElementSnippet element, string? format)
            => new InvokeStaticMethodExpression(Provider.Type, GetDateTimeOffsetMethodName, new ValueExpression[] { element, Literal(format) }, CallAsExtension: true);

        public static ValueExpression GetTimeSpan(JsonElementSnippet element, string? format)
            => new InvokeStaticMethodExpression(Provider.Type, GetTimeSpanMethodName, new ValueExpression[] { element, Literal(format) }, CallAsExtension: true);

        public static ValueExpression GetChar(JsonElementSnippet element)
            => new InvokeStaticMethodExpression(Provider.Type, GetCharMethodName, new ValueExpression[] { element }, CallAsExtension: true);

        public static MethodBodyStatement ThrowNonNullablePropertyIsNull(JsonPropertySnippet property)
            => new InvokeStaticMethodStatement(Provider.Type, ThrowNonNullablePropertyIsNullMethodName, [property], callAsExtension: true);

        public static ValueExpression GetRequiredString(JsonElementSnippet element)
            => new InvokeStaticMethodExpression(Provider.Type, GetRequiredStringMethodName, [element], CallAsExtension: true);
    }
}
