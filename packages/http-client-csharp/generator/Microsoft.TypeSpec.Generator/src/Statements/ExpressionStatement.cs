// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class ExpressionStatement : MethodBodyStatement
    {
        public ExpressionStatement(ValueExpression expression)
        {
            Expression = expression;
        }

        public ValueExpression Expression { get; private set; }

        internal override void Write(CodeWriter writer)
        {
            Expression.Write(writer);
            writer.WriteRawLine(";");
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var statement = visitor.VisitExpressionStatement(this, methodProvider);
            if (statement is not ExpressionStatement expressionStatement)
            {
                return statement?.Accept(visitor, methodProvider);
            }
            var newExpression = expressionStatement.Expression.Accept(visitor, methodProvider);
            if (newExpression == null)
            {
                return null;
            }
            expressionStatement.Expression = newExpression;
            return expressionStatement;
        }

        public void Update(ValueExpression expression)
        {
            Expression = expression;
        }
    }
}
