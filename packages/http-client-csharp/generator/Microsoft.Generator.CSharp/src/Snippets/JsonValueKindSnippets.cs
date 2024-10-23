// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class JsonValueKindSnippets
    {
        public static ScopedApi<JsonValueKind> String => Static<JsonValueKind>().Property(nameof(JsonValueKind.String)).As<JsonValueKind>();
        public static ScopedApi<JsonValueKind> Number => Static<JsonValueKind>().Property(nameof(JsonValueKind.Number)).As<JsonValueKind>();
        public static ScopedApi<JsonValueKind> True => Static<JsonValueKind>().Property(nameof(JsonValueKind.True)).As<JsonValueKind>();
        public static ScopedApi<JsonValueKind> False => Static<JsonValueKind>().Property(nameof(JsonValueKind.False)).As<JsonValueKind>();
        public static ScopedApi<JsonValueKind> Undefined => Static<JsonValueKind>().Property(nameof(JsonValueKind.Undefined)).As<JsonValueKind>();
        public static ScopedApi<JsonValueKind> Null => Static<JsonValueKind>().Property(nameof(JsonValueKind.Null)).As<JsonValueKind>();
        public static ScopedApi<JsonValueKind> Array => Static<JsonValueKind>().Property(nameof(JsonValueKind.Array)).As<JsonValueKind>();
        public static ScopedApi<JsonValueKind> Object => Static<JsonValueKind>().Property(nameof(JsonValueKind.Object)).As<JsonValueKind>();
    }
}
