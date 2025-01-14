// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public class ExpressionStatement : MethodBodyStatement
    {
        public ExpressionStatement(ValueExpression expression)
        {
            Expression = expression;
        }

        public ValueExpression Expression { get; }

        internal override void Write(CodeWriter writer)
        {
            Expression.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
