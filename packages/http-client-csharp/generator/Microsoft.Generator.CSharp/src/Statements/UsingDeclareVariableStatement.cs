// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class UsingDeclareVariableStatement : MethodBodyStatement
    {
        public CSharpType? Type { get; }
        public CodeWriterDeclaration Name { get; }
        public ValueExpression Value { get; }

        public UsingDeclareVariableStatement(CSharpType? type, CodeWriterDeclaration name, ValueExpression value)
        {
            Type = type;
            Name = name;
            Value = value;
        }

        internal override void Write(CodeWriter writer)
        {
            if (Type != null)
            {
                writer.Append($"using {Type}");
            }
            else
            {
                writer.AppendRaw("using var");
            }

            writer.Append($" {Name:D} = ");
            Value.Write(writer);
            writer.WriteRawLine(";");
        }
    }
}
