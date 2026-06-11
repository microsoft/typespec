// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record BinaryOperatorExpression(string Operator, ValueExpression Left, ValueExpression Right) : ValueExpression
    {
        internal override ExpressionPrecedence Precedence => GetPrecedence(Operator);

        internal override void Write(CodeWriter writer)
        {
            if (!writer.UseExpressionPrecedence)
            {
                writer.AppendRaw("(");
                Left.Write(writer);
                writer.AppendRawIf(" ", !Left.IsEmptyExpression());
                writer.AppendRaw(Operator);
                writer.AppendRawIf(" ", !Right.IsEmptyExpression());
                Right.Write(writer);
                writer.AppendRaw(")");
                return;
            }

            Left.WriteInContext(writer, Precedence);
            writer.AppendRawIf(" ", !Left.IsEmptyExpression());
            writer.AppendRaw(Operator);
            writer.AppendRawIf(" ", !Right.IsEmptyExpression());
            Right.WriteInContext(writer, Precedence, parenthesizeOnEqualPrecedence: true);
        }

        private static ExpressionPrecedence GetPrecedence(string @operator)
            => @operator switch
            {
                "*" or "/" or "%" => ExpressionPrecedence.Multiplicative,
                "+" or "-" => ExpressionPrecedence.Additive,
                "<<" or ">>" => ExpressionPrecedence.Shift,
                "<" or ">" or "<=" or ">=" or "is" or "is not" => ExpressionPrecedence.Relational,
                "==" or "!=" => ExpressionPrecedence.Equality,
                "&" => ExpressionPrecedence.LogicalAnd,
                "^" => ExpressionPrecedence.LogicalXor,
                "|" => ExpressionPrecedence.LogicalOr,
                "&&" or "and" => ExpressionPrecedence.ConditionalAnd,
                "||" or "or" => ExpressionPrecedence.ConditionalOr,
                "??" => ExpressionPrecedence.NullCoalescing,
                _ when @operator.EndsWith("=") => ExpressionPrecedence.Assignment,
                _ => ExpressionPrecedence.Primary
            };
    }
}
