// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DeclarationExpression(VariableReference Variable, bool IsOut) : ValueExpression
    {
        public DeclarationExpression(CSharpType type, string name, out VariableReference variable, bool isOut = false) : this(new VariableReference(type, name), isOut)
        {
            variable = Variable;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("out ", IsOut);
            writer.Append($"{Variable.Type} {Variable.Declaration:D}");
        }
    }
}
