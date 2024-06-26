// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DeclarationExpression(VariableExpression Variable, bool IsOut = false) : ValueExpression
    {
        public DeclarationExpression(CSharpType type, string name, bool isOut = false)
            : this(new VariableExpression(type, new CodeWriterDeclaration(name)), isOut)
        {
        }

        public DeclarationExpression(CSharpType type, string name, out VariableExpression variable, bool isOut = false)
            : this(new VariableExpression(type, new CodeWriterDeclaration(name)), isOut)
        {
            variable = Variable;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("out ", IsOut);
            writer.Append($"{Variable.Type} ");
            Variable.Write(writer);
        }
    }
}
