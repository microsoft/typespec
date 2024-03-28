// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record TypedTernaryConditionalOperator(BoolExpression Condition, TypedValueExpression Consequent, ValueExpression Alternative)
        : TypedValueExpression(Consequent.Type, new TernaryConditionalOperator(Condition, Consequent, Alternative));
}
