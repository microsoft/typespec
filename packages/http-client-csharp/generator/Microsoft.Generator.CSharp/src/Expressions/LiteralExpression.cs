// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis.CSharp;
using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a literal expression.
    /// </summary>
    /// <param name="Literal">The literal value.</param>
    public sealed record LiteralExpression(object? Literal) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw(Literal switch
            {
                null => "null",
                string s => SyntaxFactory.Literal(s).ToString(),
                int i => SyntaxFactory.Literal(i).ToString(),
                long l => SyntaxFactory.Literal(l).ToString(),
                decimal d => SyntaxFactory.Literal(d).ToString(),
                double d => SyntaxFactory.Literal(d).ToString(),
                float f => SyntaxFactory.Literal(f).ToString(),
                char c => SyntaxFactory.Literal(c).ToString(),
                bool b => b ? "true" : "false",
                BinaryData bd => bd.ToArray().Length == 0 ? "new byte[] { }" : SyntaxFactory.Literal(bd.ToString()).ToString(),
                _ => throw new NotImplementedException()
            });
        }
    }
}
