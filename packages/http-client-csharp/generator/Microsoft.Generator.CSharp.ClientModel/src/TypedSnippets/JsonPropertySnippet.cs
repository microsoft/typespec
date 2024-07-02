// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record JsonPropertySnippet(ValueExpression Expression) : TypedSnippet<JsonProperty>(Expression)
    {
        public ScopedApi<string> Name => Property(nameof(JsonProperty.Name)).As<string>();
        public JsonElementSnippet Value => new(Property(nameof(JsonProperty.Value)));

        public ScopedApi<bool> NameEquals(string value) => new(Expression.Invoke(nameof(JsonProperty.NameEquals), LiteralU8(value)));
    }
}
