// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record BoolExpression(ValueExpression Untyped) : TypedValueExpression<bool>(Untyped)
    {
        public BoolExpression Or(ValueExpression other) => new(new BinaryOperatorExpression(" || ", this, other));

        public BoolExpression And(ValueExpression other) => new(new BinaryOperatorExpression(" && ", this, other));

        public static BoolExpression True => new(new ConstantExpression(new Constant(true, typeof(bool))));

        public static BoolExpression False => new(new ConstantExpression(new Constant(false, typeof(bool))));

        public static BoolExpression Is(ValueExpression untyped, CSharpType comparisonType) => new(new BinaryOperatorExpression("is", untyped, comparisonType));

        public static BoolExpression Is(ValueExpression untyped, DeclarationExpression declaration) => new(new BinaryOperatorExpression("is", untyped, declaration));
    }
}
