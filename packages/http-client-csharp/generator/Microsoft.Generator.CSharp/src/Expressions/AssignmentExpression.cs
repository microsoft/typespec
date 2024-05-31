// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents an assignment expression.
    /// </summary>
    /// <param name="Variable">The variable that is being assigned.</param>
    /// <param name="Value">The value that <paramref name="Variable"/> is being assigned.</param>
    public sealed record AssignmentExpression(ValueExpression Variable, ValueExpression Value) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Variable.Write(writer);
            writer.Append($" = ");
            Value.Write(writer);
        }
    }
}
