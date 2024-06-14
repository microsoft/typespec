// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class DeclareVariableStatement : MethodBodyStatement
    {
        public CodeWriterDeclaration Name { get; }
        public ValueExpression Value { get; }
        public CSharpType? Type { get; }

        public DeclareVariableStatement(CSharpType? type, CodeWriterDeclaration name, ValueExpression value)
        {
            Name = name;
            Value = value;
            Type = type;
        }

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
