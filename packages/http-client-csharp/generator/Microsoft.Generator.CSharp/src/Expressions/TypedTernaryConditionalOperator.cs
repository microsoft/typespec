// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public record TypedTernaryConditionalOperator(BoolExpression Condition, TypedValueExpression Consequent, ValueExpression Alternative)
        : TypedValueExpression(Consequent.Type, new TernaryConditionalOperator(Condition, Consequent, Alternative));
}
