// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    /// <summary>
    /// Represents an assignment expression.
    /// </summary>
    /// <param name="Variable">The variable that is being assigned.</param>
    /// <param name="Value">The value that <paramref name="Variable"/> is being assigned.</param>
    public sealed record AssignmentExpression(ValueExpression Variable, ValueExpression Value, bool UseNullCoalesce = false) : ValueExpression
    {
        public ValueExpression Variable { get; private set; } = Variable;
        public ValueExpression Value { get; private set; } = Value;
        internal override void Write(CodeWriter writer)
        {
            Variable.Write(writer);
            if (UseNullCoalesce)
            {
                writer.Append($" ??= ");
            }
            else
            {
                writer.Append($" = ");
            }
            Value.Write(writer);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);

        internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var expr = visitor.VisitAssignmentExpression(this, method);

            if (expr is not AssignmentExpression assignmentExpression)
            {
                return expr?.Accept(visitor, method);
            }

            var newVariable = assignmentExpression.Variable.Accept(visitor, method);
            var newValue = assignmentExpression.Value.Accept(visitor, method);

            assignmentExpression.Variable = newVariable!;
            assignmentExpression.Value = newValue!;

            return assignmentExpression;
        }
    }
}
