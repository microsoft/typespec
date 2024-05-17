// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record UnaryOperatorStatement(UnaryOperatorExpression Expression) : MethodBodyStatement
    {
        public override void Write(CodeWriter writer)
        {
            Expression.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
