// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public record TupleExpression(params ValueExpression[] ValueExpressions) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("(");
            for (int i = 0; i < ValueExpressions.Length; i++)
            {
                ValueExpressions[i].Write(writer);
                if (i < ValueExpressions.Length - 1)
                {
                    writer.AppendRaw(", ");
                }
            }
            writer.AppendRaw(")");
        }
    }
}
