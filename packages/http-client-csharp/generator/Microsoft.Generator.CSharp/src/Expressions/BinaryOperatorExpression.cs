// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record BinaryOperatorExpression(string Operator, ValueExpression Left, ValueExpression Right) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("(");
            Left.Write(writer);
            writer.AppendRaw(" ").AppendRaw(Operator).AppendRaw(" ");
            Right.Write(writer);
            writer.AppendRaw(")");
        }
    }
}
