// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record IntExpression(ValueExpression Untyped) : TypedValueExpression<int>(Untyped), ITypedValueExpressionFactory<IntExpression>
    {
        public static IntExpression MaxValue => new(StaticProperty(nameof(int.MaxValue)));

        static IntExpression ITypedValueExpressionFactory<IntExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
