// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record Utf8JsonWriterExpression(ValueExpression Untyped) : TypedValueExpression<Utf8JsonWriter>(Untyped)
    {
        public MethodBodyStatement WriteStartObject() => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteStartObject));
        public MethodBodyStatement WriteEndObject() => new InvokeInstanceMethodStatement(Untyped, nameof(Utf8JsonWriter.WriteEndObject));
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

        public MethodBodyStatement WriteNumberValue(ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Configuration.ApiTypes.Utf8JsonWriterExtensionsType, Configuration.ApiTypes.Utf8JsonWriterExtensionsWriteNumberValueName, new[] { Untyped, value, Literal(format) }, null, true);

        public MethodBodyStatement WriteStringValue(ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Configuration.ApiTypes.Utf8JsonWriterExtensionsType, Configuration.ApiTypes.Utf8JsonWriterExtensionsWriteStringValueName, new[] { Untyped, value, Literal(format) }, null, true);

        public MethodBodyStatement WriteObjectValue(ValueExpression value)
            => new InvokeStaticMethodStatement(Configuration.ApiTypes.Utf8JsonWriterExtensionsType, Configuration.ApiTypes.Utf8JsonWriterExtensionsWriteObjectValueName, new[] { Untyped, value }, null, true);

        public MethodBodyStatement WriteBase64StringValue(ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Configuration.ApiTypes.Utf8JsonWriterExtensionsType, Configuration.ApiTypes.Utf8JsonWriterExtensionsWriteBase64StringValueName, new[] { Untyped, value, Literal(format) }, null, true);
    }
}
