// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record KeywordExpression(string Keyword, ValueExpression? Expression) : ValueExpression
    {
        public string Keyword { get; private set; } = Keyword;
        public ValueExpression? Expression { get; private set; } = Expression;
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw(Keyword);
            if (Expression is not null)
            {
                writer.AppendRaw(" ");
                Expression.Write(writer);
            }
        }

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var expr = visitor.VisitKeywordExpression(this, method);

            if (expr is not KeywordExpression keywordExpression)
            {
                return expr?.Accept(visitor, method);
            }

            var newExpression = keywordExpression.Expression?.Accept(visitor, method);

            keywordExpression.Expression = newExpression;
            return keywordExpression;
        }

        public void Update(string keyword, ValueExpression? expression)
        {
            Keyword = keyword;
            Expression = expression;
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
