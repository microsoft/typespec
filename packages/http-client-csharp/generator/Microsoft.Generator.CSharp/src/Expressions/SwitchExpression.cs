// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a switch case expression.
    /// </summary>
    /// <param name="MatchExpression">The match expression.</param>
    /// <param name="Cases">The list of cases represented in the form of <see cref="SwitchCaseExpression"/>.</param>
    public sealed record SwitchExpression(ValueExpression MatchExpression, params SwitchCaseExpression[] Cases) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                MatchExpression.Write(writer);
                writer.WriteRawLine(" switch");
                writer.WriteRawLine("{");
                foreach (var switchCase in Cases)
                {
                    switchCase.Case.Write(writer);
                    writer.AppendRaw(" => ");
                    switchCase.Expression.Write(writer);
                    writer.WriteRawLine(",");
                }
                writer.RemoveTrailingComma();
                writer.WriteLine();
                writer.AppendRaw("}");
            }
        }
    }
}
