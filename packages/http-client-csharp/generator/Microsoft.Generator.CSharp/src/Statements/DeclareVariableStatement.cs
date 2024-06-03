// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record DeclareVariableStatement(CSharpType? Type, CodeWriterDeclaration Name, ValueExpression Value) : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
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
