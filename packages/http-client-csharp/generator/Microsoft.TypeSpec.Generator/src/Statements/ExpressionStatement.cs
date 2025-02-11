// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Statements
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
