// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a ternary conditional operator.
    /// </summary>
    public sealed record TernaryConditionalExpression(ValueExpression Condition, ValueExpression Consequent, ValueExpression Alternative) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Condition.Write(writer);
            writer.AppendRaw(" ? ");
            Consequent.Write(writer);
            writer.AppendRaw(" : ");
            Alternative.Write(writer);
        }
    }
}
