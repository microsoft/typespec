// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record UnaryOperatorExpression(string Operator, ValueExpression Operand, bool OperandOnTheLeft) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf(Operator, !OperandOnTheLeft);
            Operand.Write(writer);
            writer.AppendRawIf(Operator, OperandOnTheLeft);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
