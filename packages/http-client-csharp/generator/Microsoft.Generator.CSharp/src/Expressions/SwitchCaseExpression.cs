// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a switch case expression.
    /// </summary>
    /// <param name="Case">The conditional case.</param>
    /// <param name="Expression">The expression.</param>
    public sealed record SwitchCaseExpression(ValueExpression Case, ValueExpression Expression)
    {
        public static SwitchCaseExpression When(ValueExpression caseExpression, BoolExpression condition, ValueExpression expression)
        {
            return new(new SwitchCaseWhenExpression(caseExpression, condition), expression);
        }
        public static SwitchCaseExpression Default(ValueExpression expression) => new SwitchCaseExpression(Snippets.Dash, expression);
    }
}
