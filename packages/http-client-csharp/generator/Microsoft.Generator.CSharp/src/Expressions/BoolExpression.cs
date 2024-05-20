// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record BoolExpression(ValueExpression Untyped) : TypedValueExpression<bool>(Untyped), ITypedValueExpressionFactory<BoolExpression>
    {
        public BoolExpression Or(ValueExpression other) => new(new BinaryOperatorExpression(" || ", this, other));

        public BoolExpression And(ValueExpression other) => new(new BinaryOperatorExpression(" && ", this, other));

        public static BoolExpression True { get; } = Snippets.True;

        public static BoolExpression False { get; } = Snippets.False;

        public static BoolExpression Is(ValueExpression untyped, CSharpType comparisonType) => new(new BinaryOperatorExpression("is", untyped, comparisonType));

        public static BoolExpression Is(ValueExpression untyped, DeclarationExpression declaration) => new(new BinaryOperatorExpression("is", untyped, declaration));

        static BoolExpression ITypedValueExpressionFactory<BoolExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
