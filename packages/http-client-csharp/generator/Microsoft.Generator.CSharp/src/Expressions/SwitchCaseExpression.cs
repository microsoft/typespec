// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a switch case expression.
    /// </summary>
    /// <param name="Case">The conditional case.</param>
    /// <param name="Expression">The expression.</param>
    public sealed record SwitchCaseExpression(ValueExpression Case, ValueExpression Expression) : ValueExpression
    {
        public static SwitchCaseExpression When(ValueExpression caseExpression, ValueExpression condition, ValueExpression expression)
        {
            return new(new SwitchCaseWhenExpression(caseExpression, condition), expression);
        }
        public static SwitchCaseExpression Default(ValueExpression expression) => new SwitchCaseExpression(Snippet.Dash, expression);

        internal override void Write(CodeWriter writer)
        {
            Case.Write(writer);
            writer.AppendRaw(" => ");
            Expression.Write(writer);
        }
    }
}
