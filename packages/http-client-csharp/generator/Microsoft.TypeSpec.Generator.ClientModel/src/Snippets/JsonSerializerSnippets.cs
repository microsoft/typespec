// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonSerializerSnippets
    {
        public static InvokeMethodExpression Serialize(ValueExpression writer, ValueExpression value, ValueExpression? options = null)
        {
            var arguments = options is null
                ? [writer, value]
                : new[] { writer, value, options };
            return Static(typeof(JsonSerializer)).Invoke(nameof(JsonSerializer.Serialize), arguments);
        }

        public static InvokeMethodExpression Deserialize(ScopedApi<JsonElement> element, CSharpType serializationType, ValueExpression? options = null)
        {
            ValueExpression[] arguments = options is null
                ? [element.GetRawText()]
                : [element.GetRawText(), options];
            return Static(typeof(JsonSerializer)).Invoke(nameof(JsonSerializer.Deserialize), arguments, [serializationType], false);
        }
    }
}
