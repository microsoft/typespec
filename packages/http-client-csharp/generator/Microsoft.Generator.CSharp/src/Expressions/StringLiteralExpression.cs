// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a string literal expression.
    /// </summary>
    /// <param name="Literal">The string literal.</param>
    /// <param name="U8">Flag used to determine if the string expression should represent a UTF-8 string.</param>
    public sealed record StringLiteralExpression(string Literal, bool U8) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.WriteLiteral(Literal);
            if (U8)
            {
                writer.AppendRaw("u8");
            }
        }
    }
}
