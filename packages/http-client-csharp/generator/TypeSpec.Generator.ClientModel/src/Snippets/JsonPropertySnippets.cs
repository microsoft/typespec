// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using TypeSpec.Generator.Snippets;
using TypeSpec.Generator.Statements;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonPropertySnippets
    {
        private const string ThrowNonNullablePropertyIsNullMethodName = "ThrowNonNullablePropertyIsNull";

        public static ScopedApi<string> Name(this ScopedApi<JsonProperty> jsonProperty)
            => jsonProperty.Property(nameof(JsonProperty.Name)).As<string>();

        public static ScopedApi<JsonElement> Value(this ScopedApi<JsonProperty> jsonProperty)
            => jsonProperty.Property(nameof(JsonProperty.Value)).As<JsonElement>();

        public static ScopedApi<bool> NameEquals(this ScopedApi<JsonProperty> jsonProperty, string value)
            => jsonProperty.Invoke(nameof(JsonProperty.NameEquals), LiteralU8(value)).As<bool>();

        public static MethodBodyStatement ThrowNonNullablePropertyIsNull(this ScopedApi<JsonProperty> property)
            => property.Invoke(ThrowNonNullablePropertyIsNullMethodName).Terminate();
    }
}
