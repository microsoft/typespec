// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record UnaryOperatorExpression(string Operator, ValueExpression Operand, bool OperandOnTheLeft) : ValueExpression;
}
