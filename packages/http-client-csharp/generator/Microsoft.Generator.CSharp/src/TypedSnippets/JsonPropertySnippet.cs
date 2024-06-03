// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record JsonPropertySnippet(ValueExpression Untyped) : TypedSnippet<JsonProperty>(Untyped)
    {
        public StringSnippet Name => new(Property(nameof(JsonProperty.Name)));
        public JsonElementSnippet Value => new(Property(nameof(JsonProperty.Value)));

        public BoolSnippet NameEquals(string value) => new(Untyped.Invoke(nameof(JsonProperty.NameEquals), LiteralU8(value)));
    }
}
