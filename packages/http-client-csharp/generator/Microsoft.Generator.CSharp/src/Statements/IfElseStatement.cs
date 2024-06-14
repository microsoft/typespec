// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Snippets;

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

        public IfElseStatement(BoolSnippet condition, MethodBodyStatement ifStatement, MethodBodyStatement? elseStatement, bool inline = false, bool addBraces = true)
            : this(new IfStatement(condition, inline, addBraces) { ifStatement }, elseStatement) {}

        internal override void Write(CodeWriter writer)
        {
            If.Write(writer);
            if (Else is null)
            {
                return;
            }

            if (If.Inline || !If.AddBraces)
            {
                using (writer.AmbientScope())
                {
                    writer.AppendRaw("else ");
                    if (!If.Inline)
                    {
                        writer.WriteLine();
                    }
                    Else.Write(writer);
                }
            }
            else
            {
                using (writer.Scope($"else"))
                {
                    Else.Write(writer);
                }
            }
        }
    }
}
