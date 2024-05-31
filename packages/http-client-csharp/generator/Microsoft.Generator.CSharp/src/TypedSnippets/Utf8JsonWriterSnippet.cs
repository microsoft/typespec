// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record Utf8JsonWriterSnippet(ValueExpression Untyped) : TypedSnippet<Utf8JsonWriter>(Untyped)
    {
        public LongSnippet BytesCommitted => new(Property(nameof(Utf8JsonWriter.BytesCommitted)));
        public LongSnippet BytesPending => new(Property(nameof(Utf8JsonWriter.BytesPending)));

        public MethodBodyStatement WriteStartObject() => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteStartObject));
        public MethodBodyStatement WriteEndObject() => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteEndObject));
        public MethodBodyStatement WriteStartArray(ValueExpression name) => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteStartArray), name);
        public MethodBodyStatement WriteStartArray() => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteStartArray));
        public MethodBodyStatement WriteEndArray() => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteEndArray));
        public MethodBodyStatement WritePropertyName(string propertyName) => WritePropertyName(LiteralU8(propertyName));
        public MethodBodyStatement WritePropertyName(ValueExpression propertyName) => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WritePropertyName), propertyName);
        public MethodBodyStatement WriteNull(string propertyName) => WriteNull(Literal(propertyName));
        public MethodBodyStatement WriteNull(ValueExpression propertyName) => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteNull), propertyName);
        public MethodBodyStatement WriteNullValue() => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteNullValue));

        public MethodBodyStatement WriteNumberValue(ValueExpression value)
            => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteNumberValue), value);

        public MethodBodyStatement WriteStringValue(ValueExpression value)
            => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteStringValue), value);

        public MethodBodyStatement WriteBooleanValue(ValueExpression value)
            => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteBooleanValue), value);

        public MethodBodyStatement WriteRawValue(ValueExpression value)
            => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteRawValue), value);

        public MethodBodyStatement WriteBase64StringValue(ValueExpression value)
            => Untyped.Invoke(nameof(Utf8JsonWriter.WriteBase64StringValue), value).ToStatement();

        public MethodBodyStatement WriteBinaryData(ValueExpression value)
            => new IfElsePreprocessorStatement
                (
                    "NET6_0_OR_GREATER",
                    WriteRawValue(value),
                    new UsingScopeStatement(typeof(JsonDocument), "document", JsonDocumentSnippet.Parse(value), out var jsonDocumentVar)
                    {
                        Snippet.JsonSerializer.Serialize(this, new JsonDocumentSnippet(jsonDocumentVar).RootElement).ToStatement()
                    }
                );

        public MethodBodyStatement Flush()
            => new InvokeInstanceMethodStatement(this, nameof(Utf8JsonWriter.Flush), Array.Empty<ValueExpression>(), false);

        public MethodBodyStatement FlushAsync(ValueExpression? cancellationToken = null)
        {
            var arguments = cancellationToken is null
                ? Array.Empty<ValueExpression>()
                : new[] { cancellationToken };
            return new InvokeInstanceMethodStatement(this, nameof(Utf8JsonWriter.FlushAsync), arguments, true);
        }
    }
}
