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

        public ValueExpression Expression { get; }

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
            var newExpression = expressionStatement.Expression.Accept(visitor, expressionStatement);
            if (newExpression == null)
            {
                return null;
            }
            if (ReferenceEquals(newExpression, expressionStatement.Expression))
            {
                return expressionStatement;
            }

            return new ExpressionStatement(newExpression);
        }
    }
}
