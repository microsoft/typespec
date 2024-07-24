// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DeclarationExpression(VariableExpression Variable, bool IsOut = false, bool IsUsing = false) : ValueExpression
    {
        public DeclarationExpression(CSharpType type, string name, bool isOut = false, bool isUsing = false)
            : this(new VariableExpression(type, new CodeWriterDeclaration(name)), isOut, isUsing)
        {
        }

        public DeclarationExpression(CSharpType type, string name, out VariableExpression variable, bool isOut = false, bool isUsing = false)
            : this(new VariableExpression(type, new CodeWriterDeclaration(name)), isOut, isUsing)
        {
            variable = Variable;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("using ", IsUsing);
            writer.AppendRawIf("out ", IsOut);
            writer.Append($"{Variable.Type} ");
            Variable.Write(writer);
        }
    }
}
