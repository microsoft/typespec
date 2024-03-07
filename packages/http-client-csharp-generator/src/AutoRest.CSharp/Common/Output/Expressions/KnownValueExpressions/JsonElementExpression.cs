// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record JsonElementExpression(ValueExpression Untyped) : TypedValueExpression<JsonElement>(Untyped)
    {
        public EnumerableExpression EnumerateArray() => new(typeof(JsonElement), Invoke(nameof(JsonElement.EnumerateArray)));
        public EnumerableExpression EnumerateObject() => new(typeof(JsonProperty), Invoke(nameof(JsonElement.EnumerateObject)));
        public JsonElementExpression this[int index] => new(new IndexerExpression(Untyped, Int(index)));
        public JsonElementExpression GetProperty(string propertyName) => new(Invoke(nameof(JsonElement.GetProperty), Literal(propertyName)));

        public ValueExpression InvokeClone() => Invoke(nameof(JsonElement.Clone));
        public ValueExpression GetArrayLength() => Invoke(nameof(JsonElement.GetArrayLength));
        public ValueExpression GetBoolean() => Invoke(nameof(JsonElement.GetBoolean));
        public ValueExpression GetBytesFromBase64(string? format) => Extensible.JsonElement.GetBytesFromBase64(this, format);
        public ValueExpression GetChar() => Extensible.JsonElement.GetChar(this);
        public ValueExpression GetDateTimeOffset(string? format) => Extensible.JsonElement.GetDateTimeOffset(this, format);
        public ValueExpression GetDateTime() => Invoke(nameof(JsonElement.GetDateTime));
        public ValueExpression GetDecimal() => Invoke(nameof(JsonElement.GetDecimal));
        public ValueExpression GetDouble() => Invoke(nameof(JsonElement.GetDouble));
        public ValueExpression GetGuid() => Invoke(nameof(JsonElement.GetGuid));
        public ValueExpression GetSByte() => Invoke(nameof(JsonElement.GetSByte));
        public ValueExpression GetByte() => Invoke(nameof(JsonElement.GetByte));
        public ValueExpression GetInt16() => Invoke(nameof(JsonElement.GetInt16));
        public ValueExpression GetInt32() => Invoke(nameof(JsonElement.GetInt32));
        public ValueExpression GetInt64() => Invoke(nameof(JsonElement.GetInt64));
        public ValueExpression GetObject() => Extensible.JsonElement.GetObject(this);
        public StringExpression GetRawText() => new(Invoke(nameof(JsonElement.GetRawText)));
        public ValueExpression GetSingle() => Untyped.Invoke(nameof(JsonElement.GetSingle));
        public StringExpression GetString() => new(Untyped.Invoke(nameof(JsonElement.GetString)));
        public ValueExpression GetTimeSpan(string? format) => Extensible.JsonElement.GetTimeSpan(this, format);

        public BoolExpression ValueKindEqualsNull()
            => new(new BinaryOperatorExpression("==", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.Null)));

        public BoolExpression ValueKindNotEqualsUndefined()
            => new(new BinaryOperatorExpression("!=", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.Undefined)));

        public BoolExpression ValueKindEqualsString()
            => new(new BinaryOperatorExpression("==", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.String)));

        public MethodBodyStatement WriteTo(ValueExpression writer) => new InvokeInstanceMethodStatement(Untyped, nameof(JsonElement.WriteTo), new[] { writer }, false);

        public BoolExpression TryGetProperty(string propertyName, out JsonElementExpression discriminator)
        {
            var discriminatorDeclaration = new VariableReference(typeof(JsonElement), "discriminator");
            discriminator = new JsonElementExpression(discriminatorDeclaration);
            var invocation = new InvokeInstanceMethodExpression(this, nameof(JsonElement.TryGetProperty), new ValueExpression[] { Literal(propertyName), new DeclarationExpression(discriminatorDeclaration, true) }, null, false);
            return new BoolExpression(invocation);
        }
    }
}
