// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record JsonElementSnippet(ValueExpression Untyped) : TypedSnippet<JsonElement>(Untyped)
    {
        public JsonValueKindSnippet ValueKind => new(Property(nameof(JsonElement.ValueKind)));
        public EnumerableSnippet EnumerateArray() => new(typeof(JsonElement), Untyped.Invoke(nameof(JsonElement.EnumerateArray)));
        public EnumerableSnippet EnumerateObject() => new(typeof(JsonProperty), Untyped.Invoke(nameof(JsonElement.EnumerateObject)));
        public JsonElementSnippet this[int index] => new(new IndexerExpression(Untyped, Int(index)));
        public JsonElementSnippet GetProperty(string propertyName) => new(Untyped.Invoke(nameof(JsonElement.GetProperty), Literal(propertyName)));

        public ValueExpression InvokeClone() => Untyped.Invoke(nameof(JsonElement.Clone));
        public ValueExpression GetArrayLength() => Untyped.Invoke(nameof(JsonElement.GetArrayLength));
        public ValueExpression GetBoolean() => Untyped.Invoke(nameof(JsonElement.GetBoolean));
        public ValueExpression GetBytesFromBase64() => Untyped.Invoke(nameof(JsonElement.GetBytesFromBase64));
        public ValueExpression GetDateTime() => Untyped.Invoke(nameof(JsonElement.GetDateTime));
        public ValueExpression GetDecimal() => Untyped.Invoke(nameof(JsonElement.GetDecimal));
        public ValueExpression GetDouble() => Untyped.Invoke(nameof(JsonElement.GetDouble));
        public ValueExpression GetGuid() => Untyped.Invoke(nameof(JsonElement.GetGuid));
        public ValueExpression GetSByte() => Untyped.Invoke(nameof(JsonElement.GetSByte));
        public ValueExpression GetByte() => Untyped.Invoke(nameof(JsonElement.GetByte));
        public ValueExpression GetInt16() => Untyped.Invoke(nameof(JsonElement.GetInt16));
        public ValueExpression GetInt32() => Untyped.Invoke(nameof(JsonElement.GetInt32));
        public ValueExpression GetInt64() => Untyped.Invoke(nameof(JsonElement.GetInt64));
        public StringSnippet GetRawText() => new(Untyped.Invoke(nameof(JsonElement.GetRawText)));
        public ValueExpression GetSingle() => Untyped.Invoke(nameof(JsonElement.GetSingle));
        public StringSnippet GetString() => new(Untyped.Invoke(nameof(JsonElement.GetString)));

        public BoolSnippet ValueKindEqualsNull()
            => new(new BinaryOperatorExpression("==", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.Null)));

        public BoolSnippet ValueKindNotEqualsUndefined()
            => new(new BinaryOperatorExpression("!=", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.Undefined)));

        public BoolSnippet ValueKindEqualsString()
            => new(new BinaryOperatorExpression("==", Property(nameof(JsonElement.ValueKind)), FrameworkEnumValue(JsonValueKind.String)));

        public MethodBodyStatement WriteTo(ValueExpression writer) => new InvokeInstanceMethodStatement(Untyped, nameof(JsonElement.WriteTo), new[] { writer }, false);

        public BoolSnippet TryGetProperty(string propertyName, out JsonElementSnippet discriminator)
        {
            var discriminatorDeclaration = new VariableReferenceSnippet(typeof(JsonElement), "discriminator");
            discriminator = new JsonElementSnippet(discriminatorDeclaration);
            var invocation = new InvokeInstanceMethodExpression(this, nameof(JsonElement.TryGetProperty), [Literal(propertyName), new DeclarationExpression(discriminatorDeclaration.Type, discriminatorDeclaration.Declaration, true)], null, false);
            return new BoolSnippet(invocation);
        }

        public BoolSnippet TryGetInt32(out IntSnippet intValue)
        {
            var intValueDeclaration = new VariableReferenceSnippet(typeof(int), "intValue");
            intValue = new IntSnippet(intValueDeclaration);
            var invocation = new InvokeInstanceMethodExpression(this, nameof(JsonElement.TryGetInt32), [new DeclarationExpression(intValueDeclaration.Type, intValueDeclaration.Declaration, true)], null, false);
            return new BoolSnippet(invocation);
        }

        public BoolSnippet TryGetInt64(out LongSnippet longValue)
        {
            var longValueDeclaration = new VariableReferenceSnippet(typeof(long), "longValue");
            longValue = new LongSnippet(longValueDeclaration);
            var invocation = new InvokeInstanceMethodExpression(this, nameof(JsonElement.TryGetInt64), [new DeclarationExpression(longValueDeclaration.Type, longValueDeclaration.Declaration, true)], null, false);
            return new BoolSnippet(invocation);
        }
    }
}
