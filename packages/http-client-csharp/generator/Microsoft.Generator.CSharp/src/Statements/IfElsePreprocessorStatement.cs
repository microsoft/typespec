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
            writer.AppendRaw($"#if {Condition}", addSpaces: false);
            writer.WriteLine();
            If.Write(writer);
            if (Else is not null)
            {
                writer.AppendRaw("#else", addSpaces: false);
                writer.WriteLine();
                Else.Write(writer);
            }

            writer.AppendRaw($"#endif", addSpaces: false);
            writer.WriteLine();
        }
    }
}
