// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record DeclarationExpression(CSharpType Type, CodeWriterDeclaration Declaration, bool IsOut = false) : ValueExpression
    {
        public DeclarationExpression(CSharpType type, string name, out VariableReferenceSnippet variable, bool isOut = false) : this(type, new CodeWriterDeclaration(name), isOut)
        {
            variable = new VariableReferenceSnippet(Type, Declaration);
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("out ", IsOut);
            writer.Append($"{Type} {Declaration:D}");
        }
    }
}
