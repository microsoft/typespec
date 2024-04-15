// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DeclareVariableStatement(CSharpType? Type, CodeWriterDeclaration Name, ValueExpression Value) : MethodBodyStatement
    {
        public override void Write(CodeWriter writer)
        {
            if (Type != null)
            {
                writer.Append($"{Type}");
            }
            else
            {
                writer.AppendRaw("var");
            }

            writer.Append($" {Name:D} = ");
            Value.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
