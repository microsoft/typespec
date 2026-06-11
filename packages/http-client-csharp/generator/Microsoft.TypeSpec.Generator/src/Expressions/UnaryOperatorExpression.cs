// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record UnaryOperatorExpression(string Operator, ValueExpression Operand, bool OperandOnTheLeft) : ValueExpression
    {
        internal override ExpressionPrecedence Precedence => OperandOnTheLeft ? ExpressionPrecedence.Primary : ExpressionPrecedence.Unary;

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf(Operator, !OperandOnTheLeft);
            Operand.WriteInContext(writer, Precedence);
            writer.AppendRawIf(Operator, OperandOnTheLeft);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
