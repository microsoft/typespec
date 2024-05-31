// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record JsonValueKindSnippet(ValueExpression Untyped) : TypedSnippet<JsonValueKind>(Untyped)
    {
        public static JsonValueKindSnippet String => InvokeStaticProperty(nameof(JsonValueKind.String));
        public static JsonValueKindSnippet Number => InvokeStaticProperty(nameof(JsonValueKind.Number));
        public static JsonValueKindSnippet True => InvokeStaticProperty(nameof(JsonValueKind.True));
        public static JsonValueKindSnippet False => InvokeStaticProperty(nameof(JsonValueKind.False));
        public static JsonValueKindSnippet Undefined => InvokeStaticProperty(nameof(JsonValueKind.Undefined));
        public static JsonValueKindSnippet Null => InvokeStaticProperty(nameof(JsonValueKind.Null));
        public static JsonValueKindSnippet Array => InvokeStaticProperty(nameof(JsonValueKind.Array));
        public static JsonValueKindSnippet Object => InvokeStaticProperty(nameof(JsonValueKind.Object));

        private static JsonValueKindSnippet InvokeStaticProperty(string name)
            => new(new MemberExpression(typeof(JsonValueKind), name));
    }
}
