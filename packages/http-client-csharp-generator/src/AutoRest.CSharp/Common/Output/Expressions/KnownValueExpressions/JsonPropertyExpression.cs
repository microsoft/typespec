// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Input;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record JsonPropertyExpression(ValueExpression Untyped) : TypedValueExpression<JsonProperty>(Untyped)
    {
        public StringExpression Name => new(Property(nameof(JsonProperty.Name)));
        public JsonElementExpression Value => new(Property(nameof(JsonProperty.Value)));

        public BoolExpression NameEquals(string value) => new(Invoke(nameof(JsonProperty.NameEquals), LiteralU8(value)));

        public MethodBodyStatement ThrowNonNullablePropertyIsNull() => Extensible.JsonElement.ThrowNonNullablePropertyIsNull(this);
    }
}
