// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record JsonSerializerSnippet(ValueExpression Untyped) : TypedSnippet(typeof(JsonSerializer), Untyped)
    {
        public static InvokeStaticMethodExpression Serialize(ValueExpression writer, ValueExpression value, ValueExpression? options = null)
        {
            var arguments = options is null
                ? [writer, value]
                : new[] { writer, value, options };
            return new InvokeStaticMethodExpression(typeof(JsonSerializer), nameof(JsonSerializer.Serialize), arguments);
        }

        public static InvokeStaticMethodExpression Deserialize(JsonElementSnippet element, CSharpType serializationType, ValueExpression? options = null)
        {
            ValueExpression[] arguments = options is null
                ? [element.GetRawText()]
                : [element.GetRawText(), options];
            return new InvokeStaticMethodExpression(typeof(JsonSerializer), nameof(JsonSerializer.Deserialize), arguments, new[] { serializationType });
        }
    }
}
