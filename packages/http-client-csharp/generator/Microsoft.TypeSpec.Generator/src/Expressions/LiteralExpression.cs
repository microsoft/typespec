// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
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
            writer.AppendRaw(Format(Literal) ?? throw new NotImplementedException());
        }

        /// <summary>
        /// Creates a <see cref="LiteralExpression"/> when <paramref name="value"/> maps to a renderable literal.
        /// </summary>
        internal static bool TryCreate(object? value, [NotNullWhen(true)] out LiteralExpression? literal)
        {
            if (Format(value) is null)
            {
                literal = null;
                return false;
            }

            literal = new LiteralExpression(value);
            return true;
        }

        private static string? Format(object? literal) => literal switch
        {
            null => "null",
            string s => SyntaxFactory.Literal(s).ToString(),
            int i => SyntaxFactory.Literal(i).ToString(),
            uint ui => SyntaxFactory.Literal(ui).ToString(),
            long l => SyntaxFactory.Literal(l).ToString(),
            ulong ul => SyntaxFactory.Literal(ul).ToString(),
            byte b => SyntaxFactory.Literal((int)b).ToString(),
            sbyte sb => SyntaxFactory.Literal((int)sb).ToString(),
            short s => SyntaxFactory.Literal((int)s).ToString(),
            ushort us => SyntaxFactory.Literal((uint)us).ToString(),
            decimal d => SyntaxFactory.Literal(d).ToString(),
            double d => SyntaxFactory.Literal(d).ToString(),
            float f => SyntaxFactory.Literal(f).ToString(),
            char c => SyntaxFactory.Literal(c).ToString(),
            bool b => b ? "true" : "false",
            BinaryData bd => bd.ToArray().Length == 0 ? "new byte[] { }" : SyntaxFactory.Literal(bd.ToString()).ToString(),
            _ => null
        };
    }
}
