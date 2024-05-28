// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record IfElsePreprocessorStatement(string Condition, MethodBodyStatement If, MethodBodyStatement? Else) : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            writer.WriteLine($"#if {Condition}");
            writer.AppendRaw("\t\t\t\t");
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
