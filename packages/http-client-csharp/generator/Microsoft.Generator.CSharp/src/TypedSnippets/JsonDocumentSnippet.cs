// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record JsonDocumentSnippet(ValueExpression Untyped) : TypedSnippet<JsonDocument>(Untyped)
    {
        public JsonElementSnippet RootElement => new(Property(nameof(JsonDocument.RootElement)));

        public static JsonDocumentSnippet ParseValue(ValueExpression reader) => new(InvokeStatic(nameof(JsonDocument.ParseValue), reader));
        public static JsonDocumentSnippet Parse(ValueExpression json) => new(InvokeStatic(nameof(JsonDocument.Parse), json));
        public static JsonDocumentSnippet Parse(BinaryDataSnippet binaryData) => new(InvokeStatic(nameof(JsonDocument.Parse), binaryData));
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
