// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class IfElsePreprocessorStatement : MethodBodyStatement
    {
        public string Condition { get; }
        public MethodBodyStatement If { get; }
        public MethodBodyStatement? Else { get; }

        public IfElsePreprocessorStatement(string condition, MethodBodyStatement ifStatement, MethodBodyStatement? elseStatement)
        {
            Condition = condition;
            If = ifStatement;
            Else = elseStatement;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.WriteLine($"#if {Condition}");
            If.Write(writer);
            if (Else is not null)
            {
                writer.WriteRawLine("#else");
                Else.Write(writer);
            }

            writer.WriteRawLine("#endif");
        }
    }
}
