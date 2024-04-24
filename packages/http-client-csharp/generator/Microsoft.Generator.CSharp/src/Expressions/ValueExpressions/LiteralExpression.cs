// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a literal expression.
    /// </summary>
    /// <param name="Literal">The literal value.</param>
    public sealed record LiteralExpression(object Literal) : ValueExpression
    {
        public override void Write(CodeWriter writer)
        {
            writer.WriteLiteral(Literal);
        }
    }
}
