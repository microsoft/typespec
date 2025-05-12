// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record KeywordExpression(string Keyword, ValueExpression? Expression) : ValueExpression
    {
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

            if (ReferenceEquals(newExpression, keywordExpression.Expression))
            {
                return keywordExpression;
            }

            return new KeywordExpression(keywordExpression.Keyword, newExpression);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
