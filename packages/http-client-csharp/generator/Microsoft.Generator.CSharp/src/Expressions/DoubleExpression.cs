// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DoubleExpression(ValueExpression Untyped) : TypedValueExpression<double>(Untyped), ITypedValueExpressionFactory<DoubleExpression>
    {
        public static DoubleExpression MaxValue => new(StaticProperty(nameof(double.MaxValue)));

        public static BoolExpression IsNan(ValueExpression d) => new(new InvokeStaticMethodExpression(typeof(double), nameof(double.IsNaN), new[] { d }));

        static DoubleExpression ITypedValueExpressionFactory<DoubleExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
