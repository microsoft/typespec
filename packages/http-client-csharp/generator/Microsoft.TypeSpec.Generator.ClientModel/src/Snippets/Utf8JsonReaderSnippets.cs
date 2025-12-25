// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    public static class Utf8JsonReaderSnippets
    {
        public static ValueExpression TokenType(this VariableExpression reader)
            => reader.Property(nameof(Utf8JsonReader.TokenType));

        public static InvokeMethodExpression Read(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.Read));

        public static InvokeMethodExpression GetString(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetString));

        public static InvokeMethodExpression GetInt32(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetInt32));

        public static InvokeMethodExpression GetInt64(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetInt64));

        public static InvokeMethodExpression GetBoolean(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetBoolean));

        public static InvokeMethodExpression GetDouble(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetDouble));

        public static InvokeMethodExpression GetSingle(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetSingle));

        public static InvokeMethodExpression GetDecimal(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetDecimal));

        public static InvokeMethodExpression GetDateTimeOffset(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetDateTimeOffset));

        public static InvokeMethodExpression GetGuid(this VariableExpression reader)
            => reader.Invoke(nameof(Utf8JsonReader.GetGuid));
    }
}
