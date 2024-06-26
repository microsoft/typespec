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
    internal sealed record Utf8JsonWriterSnippet(ValueExpression Untyped) : TypedSnippet<Utf8JsonWriter>(Untyped)
    {
        public LongSnippet BytesCommitted => new(Property(nameof(Utf8JsonWriter.BytesCommitted)));
        public LongSnippet BytesPending => new(Property(nameof(Utf8JsonWriter.BytesPending)));

        public MethodBodyStatement WriteStartObject() => Untyped.Invoke(nameof(Utf8JsonWriter.WriteStartObject)).Terminate();
        public MethodBodyStatement WriteEndObject() => Untyped.Invoke(nameof(Utf8JsonWriter.WriteEndObject)).Terminate();
        public MethodBodyStatement WriteStartArray(ValueExpression name) => Untyped.Invoke(nameof(Utf8JsonWriter.WriteStartArray), name).Terminate();
        public MethodBodyStatement WriteStartArray() => Untyped.Invoke(nameof(Utf8JsonWriter.WriteStartArray)).Terminate();
        public MethodBodyStatement WriteEndArray() => Untyped.Invoke(nameof(Utf8JsonWriter.WriteEndArray)).Terminate();
        public MethodBodyStatement WritePropertyName(string propertyName) => WritePropertyName(LiteralU8(propertyName));
        public MethodBodyStatement WritePropertyName(ValueExpression propertyName) => Untyped.Invoke(nameof(Utf8JsonWriter.WritePropertyName), propertyName).Terminate();
        public MethodBodyStatement WriteNull(string propertyName) => WriteNull(LiteralU8(propertyName));
        public MethodBodyStatement WriteNull(ValueExpression propertyName) => Untyped.Invoke(nameof(Utf8JsonWriter.WriteNull), propertyName).Terminate();
        public MethodBodyStatement WriteNullValue() => Untyped.Invoke(nameof(Utf8JsonWriter.WriteNullValue)).Terminate();

        public MethodBodyStatement WriteNumberValue(ValueExpression value)
            => Untyped.Invoke(nameof(Utf8JsonWriter.WriteNumberValue), value).Terminate();

        public MethodBodyStatement WriteStringValue(ValueExpression value)
            => Untyped.Invoke(nameof(Utf8JsonWriter.WriteStringValue), value).Terminate();

        public MethodBodyStatement WriteBooleanValue(ValueExpression value)
            => Untyped.Invoke(nameof(Utf8JsonWriter.WriteBooleanValue), value).Terminate();

        public MethodBodyStatement WriteRawValue(ValueExpression value)
            => Untyped.Invoke(nameof(Utf8JsonWriter.WriteRawValue), value).Terminate();

        public MethodBodyStatement WriteBase64StringValue(ValueExpression value)
            => Untyped.Invoke(nameof(Utf8JsonWriter.WriteBase64StringValue), value).Terminate();

        public MethodBodyStatement WriteBinaryData(ValueExpression value)
            => new IfElsePreprocessorStatement
                (
                    "NET6_0_OR_GREATER",
                    WriteRawValue(value),
                    new UsingScopeStatement(typeof(JsonDocument), "document", JsonDocumentSnippet.Parse(value), out var jsonDocumentVar)
                    {
                        JsonSerializerSnippet.Serialize(this, new JsonDocumentSnippet(jsonDocumentVar).RootElement).Terminate()
                    }
                );

        public MethodBodyStatement Flush()
            => Untyped.Invoke(nameof(Utf8JsonWriter.Flush), Array.Empty<ValueExpression>(), false).Terminate();

        public ValueExpression FlushAsync(ValueExpression? cancellationToken = null)
        {
            var arguments = cancellationToken is null
                ? Array.Empty<ValueExpression>()
                : [cancellationToken];
            return Untyped.Invoke(nameof(Utf8JsonWriter.FlushAsync), arguments, true);
        }

        internal MethodBodyStatement WriteObjectValue(TypedSnippet value, ValueExpression? options = null)
             => ModelSerializationExtensionsSnippet.WriteObjectValue(this, value, options: options);

        internal MethodBodyStatement WriteStringValue(ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippet.WriteStringValue(this, value, format);

        internal MethodBodyStatement WriteBase64StringValue(ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippet.WriteBase64StringValue(this, value, format);

        internal MethodBodyStatement WriteNumberValue(ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippet.WriteNumberValue(this, value, format);
    }
}
