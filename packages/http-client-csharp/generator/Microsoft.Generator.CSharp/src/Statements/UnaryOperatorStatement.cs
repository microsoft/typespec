// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class UnaryOperatorStatement : MethodBodyStatement
    {
        public UnaryOperatorExpression Expression { get; }

        public UnaryOperatorStatement(UnaryOperatorExpression expression)
        {
            Expression = expression;
        }

        internal override void Write(CodeWriter writer)
        {
            Expression.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
