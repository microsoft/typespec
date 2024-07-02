// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record JsonElementSnippet(ValueExpression Expression) : TypedSnippet<JsonElement>(Expression)
    {
        public JsonValueKindSnippet ValueKind => new(Property(nameof(JsonElement.ValueKind)));
        public EnumerableSnippet EnumerateArray() => new(typeof(JsonElement), Expression.Invoke(nameof(JsonElement.EnumerateArray)));
        public EnumerableSnippet EnumerateObject() => new(typeof(JsonProperty), Expression.Invoke(nameof(JsonElement.EnumerateObject)));
        public JsonElementSnippet this[int index] => new(new IndexerExpression(Expression, Int(index)));
        public JsonElementSnippet GetProperty(string propertyName) => new(Expression.Invoke(nameof(JsonElement.GetProperty), Literal(propertyName)));

        public ValueExpression InvokeClone() => Expression.Invoke(nameof(JsonElement.Clone));
        public ValueExpression GetArrayLength() => Expression.Invoke(nameof(JsonElement.GetArrayLength));
        public ValueExpression GetBoolean() => Expression.Invoke(nameof(JsonElement.GetBoolean));
        public ValueExpression GetBytesFromBase64() => Expression.Invoke(nameof(JsonElement.GetBytesFromBase64));
        public ValueExpression GetDateTime() => Expression.Invoke(nameof(JsonElement.GetDateTime));
        public ValueExpression GetDecimal() => Expression.Invoke(nameof(JsonElement.GetDecimal));
        public ValueExpression GetDouble() => Expression.Invoke(nameof(JsonElement.GetDouble));
        public ValueExpression GetGuid() => Expression.Invoke(nameof(JsonElement.GetGuid));
        public ValueExpression GetSByte() => Expression.Invoke(nameof(JsonElement.GetSByte));
        public ValueExpression GetByte() => Expression.Invoke(nameof(JsonElement.GetByte));
        public ValueExpression GetInt16() => Expression.Invoke(nameof(JsonElement.GetInt16));
        public ValueExpression GetInt32() => Expression.Invoke(nameof(JsonElement.GetInt32));
        public ValueExpression GetInt64() => Expression.Invoke(nameof(JsonElement.GetInt64));
        public StringSnippet GetRawText() => new(Expression.Invoke(nameof(JsonElement.GetRawText)));
        public ValueExpression GetSingle() => Expression.Invoke(nameof(JsonElement.GetSingle));
        public StringSnippet GetString() => new(Expression.Invoke(nameof(JsonElement.GetString)));

        public ScopedApi<bool> ValueKindEqualsNull()
            => new(new BinaryOperatorExpression("==", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.Null)));

        public ScopedApi<bool> ValueKindNotEqualsUndefined()
            => new(new BinaryOperatorExpression("!=", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.Undefined)));

        public ScopedApi<bool> ValueKindEqualsString()
            => new(new BinaryOperatorExpression("==", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.String)));

        public MethodBodyStatement WriteTo(ValueExpression writer) => Expression.Invoke(nameof(JsonElement.WriteTo), [writer], false).Terminate();

        public ValueExpression GetBytesFromBase64(string? format)
            => ModelSerializationExtensionsSnippet.GetBytesFromBase64(this, format);

        public ValueExpression GetObject()
            => ModelSerializationExtensionsSnippet.GetObject(this);

        public ValueExpression GetChar()
            => ModelSerializationExtensionsSnippet.GetChar(this);
        public ValueExpression GetDateTimeOffset(string? format)
            => ModelSerializationExtensionsSnippet.GetDateTimeOffset(this, format);

        public ValueExpression GetTimeSpan(string? format)
            => ModelSerializationExtensionsSnippet.GetTimeSpan(this, format);

        public ScopedApi<bool> TryGetProperty(string propertyName, out JsonElementSnippet discriminator)
        {
            var discriminatorDeclaration = new VariableExpression(typeof(JsonElement), "discriminator");
            discriminator = new JsonElementSnippet(discriminatorDeclaration);
            var invocation = new InvokeInstanceMethodExpression(this, nameof(JsonElement.TryGetProperty), [Literal(propertyName), new DeclarationExpression(discriminatorDeclaration, true)], null, false);
            return invocation.As<bool>();
        }

        public ScopedApi<bool> TryGetInt32(out ScopedApi<int> intValue)
        {
            var intValueDeclaration = new VariableExpression(typeof(int), "intValue");
            intValue = intValueDeclaration.As<int>();
            var invocation = new InvokeInstanceMethodExpression(this, nameof(JsonElement.TryGetInt32), [new DeclarationExpression(intValueDeclaration, true)], null, false);
            return invocation.As<bool>();
        }

        public ScopedApi<bool> TryGetInt64(out LongSnippet longValue)
        {
            var longValueDeclaration = new VariableExpression(typeof(long), "longValue");
            longValue = new LongSnippet(longValueDeclaration);
            var invocation = new InvokeInstanceMethodExpression(this, nameof(JsonElement.TryGetInt64), [new DeclarationExpression(longValueDeclaration, true)], null, false);
            return invocation.As<bool>();
        }
    }
}
