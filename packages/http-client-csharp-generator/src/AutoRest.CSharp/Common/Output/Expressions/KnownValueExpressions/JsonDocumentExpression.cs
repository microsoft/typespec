// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record JsonDocumentExpression(ValueExpression Untyped) : TypedValueExpression<JsonDocument>(Untyped)
    {
        public JsonElementExpression RootElement => new(Property(nameof(JsonDocument.RootElement)));

        public static JsonDocumentExpression ParseValue(ValueExpression reader) => new(InvokeStatic(nameof(JsonDocument.ParseValue), reader));
        public static JsonDocumentExpression Parse(ValueExpression json) => new(InvokeStatic(nameof(JsonDocument.Parse), json));
        public static JsonDocumentExpression Parse(BinaryDataExpression binaryData) => new(InvokeStatic(nameof(JsonDocument.Parse), binaryData));
        public static JsonDocumentExpression Parse(StreamExpression stream) => new(InvokeStatic(nameof(JsonDocument.Parse), stream));

        public static JsonDocumentExpression Parse(StreamExpression stream, bool async)
        {
            // Sync and async methods have different set of parameters
            return async
                ? new JsonDocumentExpression(InvokeStatic(nameof(JsonDocument.ParseAsync), new[] { stream, Snippets.Default, KnownParameters.CancellationTokenParameter }, true))
                : new JsonDocumentExpression(InvokeStatic(nameof(JsonDocument.Parse), stream));
        }
    }
}
