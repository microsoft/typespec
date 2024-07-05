// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
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
