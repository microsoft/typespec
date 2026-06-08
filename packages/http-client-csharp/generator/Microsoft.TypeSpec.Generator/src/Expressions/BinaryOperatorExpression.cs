// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record BinaryOperatorExpression(string Operator, ValueExpression Left, ValueExpression Right) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("(");
            WriteCore(writer);
            writer.AppendRaw(")");
        }

        internal override void WriteAsStatement(CodeWriter writer)
        {
            if (IsCompoundAssignmentOperator(Operator))
            {
                WriteCore(writer);
            }
            else
            {
                base.WriteAsStatement(writer);
            }
        }

        private void WriteCore(CodeWriter writer)
        {
            Left.Write(writer);
            writer.AppendRawIf(" ", !Left.IsEmptyExpression());
            writer.AppendRaw(Operator);
            writer.AppendRawIf(" ", !Right.IsEmptyExpression());
            Right.Write(writer);
        }

        private static bool IsCompoundAssignmentOperator(string @operator)
            => @operator.EndsWith("=") && @operator is not "==" and not "!=" and not "<=" and not ">=";
    }
}
