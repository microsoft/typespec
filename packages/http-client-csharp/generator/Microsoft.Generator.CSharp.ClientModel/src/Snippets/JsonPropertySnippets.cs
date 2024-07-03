// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class JsonPropertySnippets
    {
        public static ScopedApi<string> Name(this ScopedApi<JsonProperty> jsonProperty) => jsonProperty.Property(nameof(JsonProperty.Name)).As<string>();
        public static ScopedApi<JsonElement> Value(this ScopedApi<JsonProperty> jsonProperty) => jsonProperty.Property(nameof(JsonProperty.Value)).As<JsonElement>();

        public static ScopedApi<bool> NameEquals(this ScopedApi<JsonProperty> jsonProperty, string value) => jsonProperty.Invoke(nameof(JsonProperty.NameEquals), LiteralU8(value)).As<bool>();
    }
}
