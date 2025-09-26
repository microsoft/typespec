// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonDocumentSnippets
    {
        public static ScopedApi<JsonElement> RootElement(this ScopedApi<JsonDocument> document) => document.Property(nameof(JsonDocument.RootElement)).As<JsonElement>();

        public static ScopedApi<JsonDocument> ParseValue(ValueExpression reader) => Static<JsonDocument>().Invoke(nameof(JsonDocument.ParseValue), reader).As<JsonDocument>();
        public static ScopedApi<JsonDocument> Parse(ValueExpression json) => Static<JsonDocument>().Invoke(nameof(JsonDocument.Parse), json).As<JsonDocument>();
        public static ScopedApi<JsonDocument> Parse(this ScopedApi<BinaryData> binaryData) => Static<JsonDocument>().Invoke(nameof(JsonDocument.Parse), binaryData).As<JsonDocument>();
        public static ScopedApi<JsonDocument> Parse(ScopedApi<Stream> stream) => Static<JsonDocument>().Invoke(nameof(JsonDocument.Parse), stream).As<JsonDocument>();

        public static ScopedApi<JsonDocument> Parse(this ScopedApi<Stream> stream, bool async)
        {
            // Sync and async methods have different set of parameters
            return async
                ? Static<JsonDocument>().Invoke(nameof(JsonDocument.ParseAsync), [stream, Default, Default], true).As<JsonDocument>()
                : Static<JsonDocument>().Invoke(nameof(JsonDocument.Parse), stream).As<JsonDocument>();
        }
    }
}
