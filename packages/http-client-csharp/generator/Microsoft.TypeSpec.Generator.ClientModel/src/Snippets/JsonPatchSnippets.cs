// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonPatchSnippets
    {
#pragma warning disable SCME0001
        public static ScopedApi<bool> TryGetJson(
            this ScopedApi<JsonPatch> patch,
            ValueExpression jsonPath,
            out ScopedApi<ReadOnlyMemory<byte>> patchedJson)
        {
            var result = patch.Invoke(nameof(JsonPatch.TryGetJson), [jsonPath, new DeclarationExpression(typeof(ReadOnlyMemory<byte>), "patchedJson", isOut: true, variable: out var value)]).As<bool>();
            patchedJson = value.As<ReadOnlyMemory<byte>>();
            return result;
        }

        public static InvokeMethodExpression GetJson(
            this ScopedApi<JsonPatch> patch,
            ValueExpression jsonPath)
        {
            return patch.Invoke(nameof(JsonPatch.GetJson), [jsonPath]);
        }

        public static ScopedApi<bool> TryGetEncodedValue(
            this ScopedApi<JsonPatch> patch,
            ValueExpression jsonPath,
            VariableExpression encodedValue)
        => patch.Invoke(nameof(JsonPatch.TryGetEncodedValue), [jsonPath, new VariableExpression(encodedValue.Type, encodedValue.Declaration, IsOut: true)]).As<bool>();

        public static ScopedApi<bool> Contains(
            this ScopedApi<JsonPatch> patch,
            ValueExpression prefix,
            ValueExpression property)
        {
            return patch.Invoke(nameof(JsonPatch.Contains), [prefix, property]).As<bool>();
        }

        public static ScopedApi<bool> Contains(
           this ScopedApi<JsonPatch> patch,
           ValueExpression jsonPath)
        {
            return patch.Invoke(nameof(JsonPatch.Contains), [jsonPath]).As<bool>();
        }

        public static ScopedApi<bool> IsRemoved(
           this ScopedApi<JsonPatch> patch,
           ValueExpression jsonPath)
        {
            return patch.Invoke(nameof(JsonPatch.IsRemoved), [jsonPath]).As<bool>();
        }

        public static MethodBodyStatement Set(
            this ScopedApi<JsonPatch> patch,
            ValueExpression jsonPath,
            ValueExpression value)
        {
            return patch.Invoke(nameof(JsonPatch.Set), [jsonPath, value]).Terminate();
        }

        public static MethodBodyStatement SetPropagators(
            this ScopedApi<JsonPatch> patch,
            ValueExpression propagateSet,
            ValueExpression propagateGet)
        {
            return patch.Invoke(nameof(JsonPatch.SetPropagators), [propagateSet, propagateGet, Null]).Terminate();
        }

        public static InvokeMethodExpression WriteTo(
            this ScopedApi<JsonPatch> patch,
            ScopedApi<Utf8JsonWriter> writer)
        {
            return patch.Invoke(nameof(JsonPatch.WriteTo), [writer]);
        }

        public static InvokeMethodExpression WriteTo(
            this ScopedApi<JsonPatch> patch,
            ScopedApi<Utf8JsonWriter> writer,
            ValueExpression jsonPath)
        {
            return patch.Invoke(nameof(JsonPatch.WriteTo), [writer, jsonPath]);
        }
#pragma warning restore SCME0001

        public static ValueExpression GetRemainder(
            ValueExpression jsonPath,
            ValueExpression index)
        {
            return jsonPath.Invoke("GetRemainder", [index]);
        }

        public static ValueExpression GetFirstPropertyName(
            ValueExpression jsonPath,
            ValueExpression bytesConsumed)
        {
            return jsonPath.Invoke("GetFirstPropertyName", [bytesConsumed]);
        }
    }
}
