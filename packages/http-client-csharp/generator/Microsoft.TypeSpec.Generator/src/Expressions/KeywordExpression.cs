// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record KeywordExpression(string Keyword, ValueExpression? Expression) : ValueExpression
    {
        public bool Equals(KeywordExpression? other) => other is not null && base.Equals(other) &&
            Keyword == other.Keyword && System.Collections.Generic.EqualityComparer<ValueExpression?>.Default.Equals(Expression, other.Expression) &&
            System.Collections.Generic.EqualityComparer<MethodBodyStatement?>.Default.Equals(_terminated, other._terminated);

        public override int GetHashCode() => System.HashCode.Combine(base.GetHashCode(), Keyword, Expression, _terminated);

        private long _declarationRevision;
        internal long DeclarationRevision => System.Threading.Volatile.Read(ref _declarationRevision);
        public string Keyword { get; private set; } = Keyword;
        public ValueExpression? Expression { get; private set; } = Expression;
        internal override void WriteCore(CodeWriter writer)
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
            System.Threading.Interlocked.Increment(ref _declarationRevision);
            var expr = visitor.VisitKeywordExpression(this, method);

            if (expr is not KeywordExpression keywordExpression)
            {
                return expr?.Accept(visitor, method);
            }

            if (!ReferenceEquals(keywordExpression, this))
            {
                System.Threading.Interlocked.Increment(ref keywordExpression._declarationRevision);
            }

            var newExpression = keywordExpression.Expression?.Accept(visitor, method);

            keywordExpression.Expression = newExpression;
            return keywordExpression;
        }

        public void Update(string keyword, ValueExpression? expression)
        {
            System.Threading.Interlocked.Increment(ref _declarationRevision);
            Keyword = keyword;
            Expression = expression;
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
