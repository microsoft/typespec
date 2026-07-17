// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.TypeSpec.Generator.Expressions
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
                byte b => SyntaxFactory.Literal((int)b).ToString(),
                sbyte sb => SyntaxFactory.Literal((int)sb).ToString(),
                short sh => SyntaxFactory.Literal((int)sh).ToString(),
                ushort us => SyntaxFactory.Literal((int)us).ToString(),
                int i => SyntaxFactory.Literal(i).ToString(),
                uint ui => SyntaxFactory.Literal(ui).ToString(),
                long l => SyntaxFactory.Literal(l).ToString(),
                ulong ul => SyntaxFactory.Literal(ul).ToString(),
                decimal d => SyntaxFactory.Literal(d).ToString(),
                double d => SyntaxFactory.Literal(d).ToString(),
                float f => SyntaxFactory.Literal(f).ToString(),
                char c => SyntaxFactory.Literal(c).ToString(),
                bool bo => bo ? "true" : "false",
                BinaryData bd => bd.ToArray().Length == 0 ? "new byte[] { }" : SyntaxFactory.Literal(bd.ToString()).ToString(),
                _ => throw new NotImplementedException()
            });
        }
    }
}
