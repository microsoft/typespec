// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonPatchSnippets
    {
#pragma warning disable SCME0001
        public static ScopedApi<bool> TryGetJson(
            ValueExpression patch,
            ValueExpression jsonPath,
            out ScopedApi<ReadOnlyMemory<byte>> patchedJson)
        {
            var result = patch.Invoke(nameof(JsonPatch.TryGetJson), [jsonPath, new DeclarationExpression(typeof(ReadOnlyMemory<byte>), "patchedJson", isOut: true, variable: out var value)]).As<bool>();
            patchedJson = value.As<ReadOnlyMemory<byte>>();
            return result;
        }

        public static ScopedApi<bool> ContainsChildOf(
            ValueExpression patch,
            ValueExpression prefix,
            ValueExpression property)
        {
            return patch.Invoke(nameof(JsonPatch.ContainsChildOf), [prefix, property]).As<bool>();
        }
#pragma warning restore SCME0001
    }
}
