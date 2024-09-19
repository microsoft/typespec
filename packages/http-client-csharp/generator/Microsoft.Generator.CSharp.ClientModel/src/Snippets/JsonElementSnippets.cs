// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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

        public static ScopedApi<bool> TryGetInt16(this ScopedApi<JsonElement> jsonElement, out ScopedApi<short> shortValue)
        {
            var shortValueDeclaration = new VariableExpression(typeof(short), "shortValue");
            shortValue = shortValueDeclaration.As<short>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetInt16), [new DeclarationExpression(shortValueDeclaration, true)]);
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

        public static ScopedApi<bool> TryGetSingle(this ScopedApi<JsonElement> jsonElement, out ScopedApi<float> floatValue)
        {
            var floatValueDeclaration = new VariableExpression(typeof(float), "floatValue");
            floatValue= floatValueDeclaration.As<float>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetSingle), [new DeclarationExpression(floatValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetDouble(this ScopedApi<JsonElement> jsonElement, out ScopedApi<double> doubleValue)
        {
            var doubleValueDeclaration = new VariableExpression(typeof(double), "doubleValue");
            doubleValue = doubleValueDeclaration.As<double>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetDouble), [new DeclarationExpression(doubleValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetByte(this ScopedApi<JsonElement> jsonElement, out ScopedApi<byte> byteValue)
        {
            var byteValueDeclaration = new VariableExpression(typeof(byte), "byteValue");
            byteValue = byteValueDeclaration.As<byte>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetByte), [new DeclarationExpression(byteValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetSByte(this ScopedApi<JsonElement> jsonElement, out ScopedApi<sbyte> sbyteValue)
        {
            var sbyteValueDeclaration = new VariableExpression(typeof(sbyte), "sbyteValue");
            sbyteValue = sbyteValueDeclaration.As<sbyte>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetSByte), [new DeclarationExpression(sbyteValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetUInt16(this ScopedApi<JsonElement> jsonElement, out ScopedApi<ushort> ushortValue)
        {
            var ushortValueDeclaration = new VariableExpression(typeof(ushort), "ushortValue");
            ushortValue = ushortValueDeclaration.As<ushort>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetUInt16), [new DeclarationExpression(ushortValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetUInt64(this ScopedApi<JsonElement> jsonElement, out ScopedApi<ulong> ulongValue)
        {
            var ulongValueDeclaration = new VariableExpression(typeof(ulong), "ulongValue");
            ulongValue = ulongValueDeclaration.As<ulong>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetUInt64), [new DeclarationExpression(ulongValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetUInt32(this ScopedApi<JsonElement> jsonElement, out ScopedApi<uint> uintValue)
        {
            var uintValueDeclaration = new VariableExpression(typeof(uint), "uintValue");
            uintValue = uintValueDeclaration.As<uint>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetUInt32), [new DeclarationExpression(uintValueDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetBytesFromBase64(this ScopedApi<JsonElement> jsonElement, out ScopedApi<byte[]> bytes)
        {
            var bytesDeclaration = new VariableExpression(typeof(byte[]), "bytes");
            bytes = bytesDeclaration.As<byte[]>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetBytesFromBase64), [new DeclarationExpression(bytesDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetDateTime(this ScopedApi<JsonElement> jsonElement, out ScopedApi<DateTime> dateTime)
        {
            var dateTimeDeclaration = new VariableExpression(typeof(DateTime), "dateTime");
            dateTime = dateTimeDeclaration.As<DateTime>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetDateTime), [new DeclarationExpression(dateTimeDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetDateTimeOffset(this ScopedApi<JsonElement> jsonElement, out ScopedApi<DateTimeOffset> dateTimeOffset)
        {
            var dateTimeOffsetDeclaration = new VariableExpression(typeof(DateTimeOffset), "dateTimeOffset");
            dateTimeOffset = dateTimeOffsetDeclaration.As<DateTimeOffset>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetDateTimeOffset), [new DeclarationExpression(dateTimeOffsetDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetGuid(this ScopedApi<JsonElement> jsonElement, out ScopedApi<Guid> guid)
        {
            var guidDeclaration = new VariableExpression(typeof(Guid), "guid");
            guid = guidDeclaration.As<Guid>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetGuid), [new DeclarationExpression(guidDeclaration, true)]);
            return invocation.As<bool>();
        }

        public static ScopedApi<bool> TryGetDecimal(this ScopedApi<JsonElement> jsonElement, out ScopedApi<decimal> decimalValue)
        {
            var decimalValueDeclaration = new VariableExpression(typeof(decimal), "decimalValue");
            decimalValue = decimalValueDeclaration.As<decimal>();
            var invocation = new InvokeMethodExpression(jsonElement, nameof(JsonElement.TryGetDecimal), [new DeclarationExpression(decimalValueDeclaration, true)]);
            return invocation.As<bool>();
        }
    }
}
