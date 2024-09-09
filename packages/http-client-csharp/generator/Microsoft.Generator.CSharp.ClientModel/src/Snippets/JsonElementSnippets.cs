// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class JsonElementSnippets
    {
        private const string GetRequiredStringMethodName = "GetRequiredString";

        public static ScopedApi<JsonValueKind> ValueKind(this ScopedApi<JsonElement> jsonElement) => jsonElement.Property(nameof(JsonElement.ValueKind)).As<JsonValueKind>();
        public static ScopedApi<IEnumerable<JsonElement>> EnumerateArray(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.EnumerateArray)).As<IEnumerable<JsonElement>>();
        public static ScopedApi<IEnumerable<JsonProperty>> EnumerateObject(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.EnumerateObject)).As<IEnumerable<JsonProperty>>();
        //public static ScopedApi<JsonElement> this[int index] => new(new IndexerExpression(Expression, Int(index)));
        public static ScopedApi<JsonElement> GetProperty(this ScopedApi<JsonElement> jsonElement, string propertyName) => jsonElement.Invoke(nameof(JsonElement.GetProperty), Literal(propertyName)).As<JsonElement>();

        public static ValueExpression InvokeClone(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.Clone));
        public static ValueExpression GetArrayLength(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetArrayLength));
        public static ValueExpression GetBoolean(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetBoolean));
        public static ValueExpression GetBytesFromBase64(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetBytesFromBase64));
        public static ValueExpression GetDateTime(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetDateTime));
        public static ValueExpression GetDecimal(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetDecimal));
        public static ValueExpression GetDouble(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetDouble));
        public static ValueExpression GetGuid(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetGuid));
        public static ValueExpression GetSByte(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetSByte));
        public static ValueExpression GetByte(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetByte));
        public static ValueExpression GetInt16(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetInt16));
        public static ValueExpression GetInt32(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetInt32));
        public static ValueExpression GetInt64(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetInt64));
        public static ScopedApi<string> GetRawText(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetRawText)).As<string>();
        public static ValueExpression GetSingle(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetSingle));
        public static ScopedApi<string> GetString(this ScopedApi<JsonElement> jsonElement) => jsonElement.Invoke(nameof(JsonElement.GetString)).As<string>();

        public static ScopedApi<bool> ValueKindEqualsNull(this ScopedApi<JsonElement> jsonElement)
            => jsonElement.Property(nameof(JsonElement.ValueKind)).Equal(FrameworkEnumValue(JsonValueKind.Null));

        public static ScopedApi<bool> ValueKindNotEqualsUndefined(this ScopedApi<JsonElement> jsonElement)
            => jsonElement.Property(nameof(JsonElement.ValueKind)).NotEqual(FrameworkEnumValue(JsonValueKind.Undefined));

        public static ScopedApi<bool> ValueKindEqualsString(this ScopedApi<JsonElement> jsonElement)
            => jsonElement.Property(nameof(JsonElement.ValueKind)).Equal(FrameworkEnumValue(JsonValueKind.String));

        public static MethodBodyStatement WriteTo(this ScopedApi<JsonElement> jsonElement, ValueExpression writer)
            => jsonElement.Invoke(nameof(JsonElement.WriteTo), [writer], false).Terminate();

        public static ValueExpression GetBytesFromBase64(this ScopedApi<JsonElement> jsonElement, string? format)
            => jsonElement.Invoke(nameof(JsonElement.GetBytesFromBase64), format is null ? [] : [Literal(format)]);

        public static ValueExpression GetObject(this ScopedApi<JsonElement> jsonElement)
            => jsonElement.Invoke("GetObject");

        public static ValueExpression GetChar(this ScopedApi<JsonElement> jsonElement)
            => jsonElement.Invoke("GetChar");

        public static ValueExpression GetDateTimeOffset(this ScopedApi<JsonElement> jsonElement, string? format)
            => jsonElement.Invoke(nameof(JsonElement.GetDateTimeOffset), format is null ? [] : [Literal(format)]);

        public static ValueExpression GetTimeSpan(this ScopedApi<JsonElement> jsonElement, string? format)
            => jsonElement.Invoke("GetTimeSpan", format is null ? [] : [Literal(format)]);

        public static ScopedApi<string> GetRequiredString(this ScopedApi<JsonElement> element)
            => element.Invoke(GetRequiredStringMethodName).As<string>();

        public static ScopedApi<bool> TryGetProperty(this ScopedApi<JsonElement> jsonElement, string propertyName, out ScopedApi<JsonElement> discriminator)
        {
            var discriminatorDeclaration = new VariableExpression(typeof(JsonElement), "discriminator");
            discriminator = discriminatorDeclaration.As<JsonElement>();
            var invocation = jsonElement.Invoke(nameof(JsonElement.TryGetProperty), [LiteralU8(propertyName), new DeclarationExpression(discriminatorDeclaration, true)], null, false);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetInt32(this ScopedApi<JsonElement> jsonElement, out ScopedApi<int> intValue)
        {
            var intValueDeclaration = new VariableExpression(typeof(int), "intValue");
            intValue = intValueDeclaration.As<int>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetInt32), [new DeclarationExpression(intValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetInt64(this ScopedApi<JsonElement> jsonElement, out ScopedApi<long> longValue)
        {
            var longValueDeclaration = new VariableExpression(typeof(long), "longValue");
            longValue = longValueDeclaration.As<long>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetInt64), [new DeclarationExpression(longValueDeclaration, true)]);
            return invocation.As<bool>();
        }
    }
}
