// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;

namespace Microsoft.Generator.CSharp.Expressions
{
    public static class JsonSerializerExpression
    {
        public static InvokeStaticMethodExpression Serialize(ValueExpression writer, ValueExpression value, ValueExpression? options = null)
        {
            var arguments = options is null
                ? new[] { writer, value }
                : new[] { writer, value, options };
            return new InvokeStaticMethodExpression(typeof(JsonSerializer), nameof(JsonSerializer.Serialize), arguments);
        }

        public static InvokeStaticMethodExpression Deserialize(JsonElementExpression element, CSharpType serializationType, ValueExpression? options = null)
        {
            var arguments = options is null
                ? new[] { element.GetRawText() }
                : new[] { element.GetRawText(), options };
            return new InvokeStaticMethodExpression(typeof(JsonSerializer), nameof(JsonSerializer.Deserialize), arguments, new[] { serializationType });
        }
    }
}
