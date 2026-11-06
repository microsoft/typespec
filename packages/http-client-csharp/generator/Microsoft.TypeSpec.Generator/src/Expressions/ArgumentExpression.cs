// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    /// <summary>
    /// Represents a method argument that wraps a <see cref="ValueExpression"/> with optional <c>ref</c> or <c>out</c> modifiers.
    /// </summary>
    public sealed record ArgumentExpression(ValueExpression Expression, bool IsRef = false, bool IsOut = false) : ValueExpression
    {
        public bool Equals(ArgumentExpression? other) => other is not null && base.Equals(other) &&
            System.Collections.Generic.EqualityComparer<ValueExpression>.Default.Equals(Expression, other.Expression) &&
            IsRef == other.IsRef && IsOut == other.IsOut && IsIn == other.IsIn;

        public override int GetHashCode() => System.HashCode.Combine(base.GetHashCode(), Expression, IsRef, IsOut, IsIn);

        private long _declarationRevision;
        internal long DeclarationRevision => System.Threading.Volatile.Read(ref _declarationRevision);
        public bool IsIn { get; private set; }
        public ValueExpression Expression { get; private set; } = Expression;
        public bool IsRef { get; private set; } = IsRef;
        public bool IsOut { get; private set; } = IsOut;

        internal override void WriteCore(CodeWriter writer)
        {
            writer.AppendRawIf("ref ", IsRef);
            writer.AppendRawIf("out ", IsOut);
            writer.AppendRawIf("in ", IsIn);
            Expression.Write(writer);
        }

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            System.Threading.Interlocked.Increment(ref _declarationRevision);
            var expr = visitor.VisitArgumentExpression(this, method);

            if (expr is not ArgumentExpression argumentExpression)
            {
                return expr?.Accept(visitor, method);
            }

            if (!ReferenceEquals(argumentExpression, this))
            {
                System.Threading.Interlocked.Increment(ref argumentExpression._declarationRevision);
            }

            var newExpression = argumentExpression.Expression.Accept(visitor, method);
            if (newExpression != null)
            {
                argumentExpression.Expression = newExpression;
            }

            return argumentExpression;
        }

        public void Update(ValueExpression? expression = null, bool? isRef = null, bool? isOut = null, bool? isIn = null)
        {
            System.Threading.Interlocked.Increment(ref _declarationRevision);
            if (isIn != null)
            {
                IsIn = isIn.Value;
            }
            if (expression != null)
            {
                Expression = expression;
            }

            if (isRef != null)
            {
                IsRef = isRef.Value;
            }

            if (isOut != null)
            {
                IsOut = isOut.Value;
            }
        }
    }
}
