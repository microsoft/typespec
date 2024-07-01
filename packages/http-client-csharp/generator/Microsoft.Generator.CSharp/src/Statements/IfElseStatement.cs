// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class IfElseStatement : MethodBodyStatement
    {
        public IfStatement If { get; }
        public MethodBodyStatement? Else { get; }

        public IfElseStatement(IfStatement ifStatement, MethodBodyStatement? elseStatement)
        {
            If = ifStatement;
            Else = elseStatement;
        }

        public IfElseStatement(ValueExpression condition, MethodBodyStatement ifStatement, MethodBodyStatement? elseStatement, bool inline = false, bool addBraces = true)
            : this(new IfStatement(condition, inline, addBraces) { ifStatement }, elseStatement) { }

        internal override void Write(CodeWriter writer)
        {
            If.Write(writer);
            if (Else is not null)
            {
                writer.WriteLine($"else");
                using (writer.Scope())
                {
                    Else.Write(writer);
                }
            }
        }
    }
}
