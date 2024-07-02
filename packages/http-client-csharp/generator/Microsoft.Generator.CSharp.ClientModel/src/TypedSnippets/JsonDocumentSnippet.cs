// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record JsonDocumentSnippet(ValueExpression Expression) : TypedSnippet<JsonDocument>(Expression)
    {
        public JsonElementSnippet RootElement => new(Property(nameof(JsonDocument.RootElement)));

        public static JsonDocumentSnippet ParseValue(ValueExpression reader) => new(InvokeStatic(nameof(JsonDocument.ParseValue), reader));
        public static JsonDocumentSnippet Parse(ValueExpression json) => new(InvokeStatic(nameof(JsonDocument.Parse), json));
        public static JsonDocumentSnippet Parse(ScopedApi<BinaryData> binaryData) => new(InvokeStatic(nameof(JsonDocument.Parse), binaryData));
        public static JsonDocumentSnippet Parse(StreamSnippet stream) => new(InvokeStatic(nameof(JsonDocument.Parse), stream));

        public static JsonDocumentSnippet Parse(StreamSnippet stream, bool async)
        {
            // Sync and async methods have different set of parameters
            return async
                ? new JsonDocumentSnippet(InvokeStatic(nameof(JsonDocument.ParseAsync), new[] { stream, Snippet.Default, Snippet.Default }, true))
                : new JsonDocumentSnippet(InvokeStatic(nameof(JsonDocument.Parse), stream));
        }
    }
}
