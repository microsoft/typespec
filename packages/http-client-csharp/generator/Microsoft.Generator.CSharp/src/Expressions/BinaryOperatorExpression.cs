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
            writer.AppendRawIf(" ", !ReferenceEquals(Left, Empty));
            writer.AppendRaw(Operator);
            writer.AppendRawIf(" ", !ReferenceEquals(Right, Empty));
            Right.Write(writer);
            writer.AppendRaw(")");
        }
    }
}
