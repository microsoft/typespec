// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class Utf8JsonWriterSnippets
    {
        public static ScopedApi<long> BytesCommitted(this ScopedApi<Utf8JsonWriter> writer) => writer.Property(nameof(Utf8JsonWriter.BytesCommitted)).As<long>();
        public static ScopedApi<long> BytesPending(this ScopedApi<Utf8JsonWriter> writer) => writer.Property(nameof(Utf8JsonWriter.BytesPending)).As<long>();

        public static MethodBodyStatement WriteStartObject(this ScopedApi<Utf8JsonWriter> writer) => writer.Invoke(nameof(Utf8JsonWriter.WriteStartObject)).Terminate();
        public static MethodBodyStatement WriteEndObject(this ScopedApi<Utf8JsonWriter> writer) => writer.Invoke(nameof(Utf8JsonWriter.WriteEndObject)).Terminate();
        public static MethodBodyStatement WriteStartArray(this ScopedApi<Utf8JsonWriter> writer, ValueExpression name) => writer.Invoke(nameof(Utf8JsonWriter.WriteStartArray), name).Terminate();
        public static MethodBodyStatement WriteStartArray(this ScopedApi<Utf8JsonWriter> writer) => writer.Invoke(nameof(Utf8JsonWriter.WriteStartArray)).Terminate();
        public static MethodBodyStatement WriteEndArray(this ScopedApi<Utf8JsonWriter> writer) => writer.Invoke(nameof(Utf8JsonWriter.WriteEndArray)).Terminate();
        public static MethodBodyStatement WritePropertyName(this ScopedApi<Utf8JsonWriter> writer, string propertyName) => writer.WritePropertyName(LiteralU8(propertyName));
        public static MethodBodyStatement WritePropertyName(this ScopedApi<Utf8JsonWriter> writer, ValueExpression propertyName) => writer.Invoke(nameof(Utf8JsonWriter.WritePropertyName), propertyName).Terminate();
        public static MethodBodyStatement WriteNull(this ScopedApi<Utf8JsonWriter> writer, string propertyName) => writer.WriteNull(LiteralU8(propertyName));
        public static MethodBodyStatement WriteNull(this ScopedApi<Utf8JsonWriter> writer, ValueExpression propertyName) => writer.Invoke(nameof(Utf8JsonWriter.WriteNull), propertyName).Terminate();
        public static MethodBodyStatement WriteNullValue(this ScopedApi<Utf8JsonWriter> writer) => writer.Invoke(nameof(Utf8JsonWriter.WriteNullValue)).Terminate();

        public static MethodBodyStatement WriteNumberValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value)
            => writer.Invoke(nameof(Utf8JsonWriter.WriteNumberValue), value).Terminate();

        public static MethodBodyStatement WriteStringValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value)
            => writer.Invoke(nameof(Utf8JsonWriter.WriteStringValue), value).Terminate();

        public static MethodBodyStatement WriteBooleanValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value)
            => writer.Invoke(nameof(Utf8JsonWriter.WriteBooleanValue), value).Terminate();

        public static MethodBodyStatement WriteRawValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value)
            => writer.Invoke(nameof(Utf8JsonWriter.WriteRawValue), value).Terminate();

        public static MethodBodyStatement WriteBase64StringValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value)
            => writer.Invoke(nameof(Utf8JsonWriter.WriteBase64StringValue), value).Terminate();

        public static MethodBodyStatement WriteBinaryData(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value)
            => new IfElsePreprocessorStatement
                (
                    "NET6_0_OR_GREATER",
                    writer.WriteRawValue(value),
                    new UsingScopeStatement(typeof(JsonDocument), "document", JsonDocumentSnippets.Parse(value), out var jsonDocumentVar)
                    {
                        JsonSerializerSnippets.Serialize(writer, jsonDocumentVar.As<JsonDocument>().RootElement()).Terminate()
                    }
                );

        public static MethodBodyStatement Flush(this ScopedApi<Utf8JsonWriter> writer)
            => writer.Invoke(nameof(Utf8JsonWriter.Flush), Array.Empty<ValueExpression>()).Terminate();

        public static InvokeMethodExpression FlushAsync(this ScopedApi<Utf8JsonWriter> writer, ValueExpression? cancellationToken = null)
        {
            var arguments = cancellationToken is null
                ? Array.Empty<ValueExpression>()
                : [cancellationToken];
            return writer.Invoke(nameof(Utf8JsonWriter.FlushAsync), arguments, true);
        }

        internal static MethodBodyStatement WriteObjectValue(this ScopedApi<Utf8JsonWriter> writer, ScopedApi value, ValueExpression? options = null)
             => ModelSerializationExtensionsSnippets.WriteObjectValue(writer, value, options: options);

        internal static MethodBodyStatement WriteStringValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippets.WriteStringValue(writer, value, format);

        internal static MethodBodyStatement WriteBase64StringValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippets.WriteBase64StringValue(writer, value, format);

        internal static MethodBodyStatement WriteNumberValue(this ScopedApi<Utf8JsonWriter> writer, ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippets.WriteNumberValue(writer, value, format);
    }
}
