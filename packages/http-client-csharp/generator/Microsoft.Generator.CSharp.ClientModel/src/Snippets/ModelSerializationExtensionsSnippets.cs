// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ModelSerializationExtensionsSnippets
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
        private const string WireOptionsName = "WireOptions";

        public static readonly ScopedApi<ModelReaderWriterOptions> Wire = Static<ModelSerializationExtensionsProvider>().Property(WireOptionsName).As<ModelReaderWriterOptions>();

        public static MethodBodyStatement WriteObjectValue(Utf8JsonWriterSnippet snippet, ScopedApi value, ValueExpression? options = null)
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

        public static ValueExpression GetObject(this ScopedApi<ModelSerializationExtensionsProvider> provider, ScopedApi<JsonElement> element)
            => provider.Invoke(GetObjectMethodName, [element]);

        public static ValueExpression GetBytesFromBase64(this ScopedApi<ModelSerializationExtensionsProvider> provider, ScopedApi<JsonElement> element, string? format)
            => provider.Invoke(GetBytesFromBase64MethodName, [element, Literal(format)]);

        public static ValueExpression GetDateTimeOffset(this ScopedApi<ModelSerializationExtensionsProvider> provider, ScopedApi<JsonElement> element, string? format)
            => provider.Invoke(GetDateTimeOffsetMethodName, [element, Literal(format)]);

        public static ValueExpression GetTimeSpan(this ScopedApi<ModelSerializationExtensionsProvider> provider, ScopedApi<JsonElement> element, string? format)
            => provider.Invoke(GetTimeSpanMethodName, [element, Literal(format)]);

        public static ValueExpression GetChar(this ScopedApi<ModelSerializationExtensionsProvider> provider, ScopedApi<JsonElement> element)
            => provider.Invoke(GetCharMethodName, [element]);
    }
}
