// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record UnaryOperatorStatement(UnaryOperatorExpression Expression) : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            Expression.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
