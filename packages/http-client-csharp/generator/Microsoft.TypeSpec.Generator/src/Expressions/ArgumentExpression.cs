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
        public ValueExpression Expression { get; private set; } = Expression;
        public bool IsRef { get; private set; } = IsRef;
        public bool IsOut { get; private set; } = IsOut;

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("ref ", IsRef);
            writer.AppendRawIf("out ", IsOut);
            Expression.Write(writer);
        }

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var expr = visitor.VisitArgumentExpression(this, method);

            if (expr is not ArgumentExpression argumentExpression)
            {
                return expr?.Accept(visitor, method);
            }

            var newExpression = argumentExpression.Expression.Accept(visitor, method);
            if (newExpression != null)
            {
                argumentExpression.Expression = newExpression;
            }

            return argumentExpression;
        }

        public void Update(ValueExpression? expression = null, bool? isRef = null, bool? isOut = null)
        {
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
