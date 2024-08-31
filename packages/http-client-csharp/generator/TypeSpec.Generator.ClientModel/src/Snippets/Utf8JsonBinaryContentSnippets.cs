// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using TypeSpec.Generator.ClientModel.Providers;
using TypeSpec.Generator.Snippets;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class Utf8JsonBinaryContentSnippets
    {
        public static ScopedApi<Utf8JsonWriter> JsonWriter(this ScopedApi<Utf8JsonBinaryContentDefinition> utf8JsonBinaryContent)
            => utf8JsonBinaryContent.Property("JsonWriter").As<Utf8JsonWriter>();
    }
}
