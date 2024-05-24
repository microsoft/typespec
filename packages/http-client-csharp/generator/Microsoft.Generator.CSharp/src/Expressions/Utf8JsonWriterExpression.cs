// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record Utf8JsonWriterExpression(ValueExpression Untyped) : TypedValueExpression<Utf8JsonWriter>(Untyped)
    {
        public LongExpression BytesCommitted => new(Property(nameof(Utf8JsonWriter.BytesCommitted)));
        public LongExpression BytesPending => new(Property(nameof(Utf8JsonWriter.BytesPending)));

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
            => Invoke(nameof(Utf8JsonWriter.WriteBase64StringValue), value).ToStatement();

        public MethodBodyStatement WriteBinaryData(ValueExpression value)
            => new IfElsePreprocessorDirective
                (
                    "NET6_0_OR_GREATER",
                    WriteRawValue(value),
                    new UsingScopeStatement(typeof(JsonDocument), "document", JsonDocumentExpression.Parse(value), out var jsonDocumentVar)
                    {
                        JsonSerializerExpression.Serialize(this, new JsonDocumentExpression(jsonDocumentVar).RootElement).ToStatement()
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
