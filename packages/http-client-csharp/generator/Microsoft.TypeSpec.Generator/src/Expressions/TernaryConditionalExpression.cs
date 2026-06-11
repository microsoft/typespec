// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Expressions
{
    /// <summary>
    /// Represents a ternary conditional operator.
    /// </summary>
    public sealed record TernaryConditionalExpression(ValueExpression Condition, ValueExpression Consequent, ValueExpression Alternative) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Condition.WriteNested(writer);
            writer.AppendRaw(" ? ");
            Consequent.WriteNested(writer);
            writer.AppendRaw(" : ");
            Alternative.WriteNested(writer);
        }
    }
}
