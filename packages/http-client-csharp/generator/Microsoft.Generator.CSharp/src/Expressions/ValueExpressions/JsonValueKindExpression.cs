// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record JsonValueKindExpression(ValueExpression Untyped) : TypedValueExpression<JsonValueKind>(Untyped), ITypedValueExpressionFactory<JsonValueKindExpression>
    {
        public static JsonValueKindExpression String => InvokeStaticProperty(nameof(JsonValueKind.String));
        public static JsonValueKindExpression Number => InvokeStaticProperty(nameof(JsonValueKind.Number));
        public static JsonValueKindExpression True => InvokeStaticProperty(nameof(JsonValueKind.True));
        public static JsonValueKindExpression False => InvokeStaticProperty(nameof(JsonValueKind.False));
        public static JsonValueKindExpression Undefined => InvokeStaticProperty(nameof(JsonValueKind.Undefined));
        public static JsonValueKindExpression Null => InvokeStaticProperty(nameof(JsonValueKind.Null));
        public static JsonValueKindExpression Array => InvokeStaticProperty(nameof(JsonValueKind.Array));
        public static JsonValueKindExpression Object => InvokeStaticProperty(nameof(JsonValueKind.Object));

        private static JsonValueKindExpression InvokeStaticProperty(string name)
            => new(new MemberExpression(typeof(JsonValueKind), name));

        static JsonValueKindExpression ITypedValueExpressionFactory<JsonValueKindExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
