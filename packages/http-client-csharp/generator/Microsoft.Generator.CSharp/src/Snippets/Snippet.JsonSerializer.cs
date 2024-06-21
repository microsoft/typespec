// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public static class JsonSerializer
        {
            public static InvokeStaticMethodExpression Serialize(ValueExpression writer, ValueExpression value, ValueExpression? options = null)
            {
                var arguments = options is null
                    ? new[] { writer, value }
                    : new[] { writer, value, options };
                return new InvokeStaticMethodExpression(typeof(System.Text.Json.JsonSerializer), nameof(System.Text.Json.JsonSerializer.Serialize), arguments);
            }

            public static InvokeStaticMethodExpression Deserialize(JsonElementSnippet element, CSharpType serializationType, ValueExpression? options = null)
            {
                ValueExpression[] arguments = options is null
                    ? [element.GetRawText()]
                    : new[] { element.GetRawText(), options };
                return new InvokeStaticMethodExpression(typeof(System.Text.Json.JsonSerializer), nameof(System.Text.Json.JsonSerializer.Deserialize), arguments, new[] { serializationType });
            }
        }
    }
}
