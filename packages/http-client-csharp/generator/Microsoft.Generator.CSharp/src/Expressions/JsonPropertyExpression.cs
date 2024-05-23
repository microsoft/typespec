// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record JsonPropertyExpression(ValueExpression Untyped) : TypedValueExpression<JsonProperty>(Untyped)
    {
        public StringExpression Name => new(Property(nameof(JsonProperty.Name)));
        public JsonElementExpression Value => new(Property(nameof(JsonProperty.Value)));

        public BoolExpression NameEquals(string value) => new(Invoke(nameof(JsonProperty.NameEquals), LiteralU8(value)));
    }
}
