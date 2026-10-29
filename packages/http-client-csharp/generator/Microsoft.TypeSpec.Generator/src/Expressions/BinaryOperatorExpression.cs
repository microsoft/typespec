// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record BinaryOperatorExpression(string Operator, ValueExpression Left, ValueExpression Right) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("(");
            WriteUnparenthesized(writer);
            writer.AppendRaw(")");
        }

        internal void WriteUnparenthesized(CodeWriter writer)
        {
            Left.Write(writer);
            writer.AppendRawIf(" ", !Left.IsEmptyExpression());
            writer.AppendRaw(Operator);
            writer.AppendRawIf(" ", !Right.IsEmptyExpression());
            Right.Write(writer);
        }
    }
}
