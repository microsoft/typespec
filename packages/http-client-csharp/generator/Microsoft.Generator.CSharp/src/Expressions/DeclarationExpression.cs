// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DeclarationExpression(VariableReferenceSnippet Variable, bool IsOut) : ValueExpression
    {
        public DeclarationExpression(CSharpType type, string name, out VariableReferenceSnippet variable, bool isOut = false) : this(new VariableReferenceSnippet(type, name), isOut)
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
