// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record VariableReferenceSnippet(CSharpType Type, CodeWriterDeclaration Declaration) : TypedSnippet(Type, new UntypedVariableReference(Declaration))
    {
        public VariableReferenceSnippet(CSharpType type, string name) : this(type, new CodeWriterDeclaration(name)) { }

        private record UntypedVariableReference(CodeWriterDeclaration Declaration) : ValueExpression
        {
            internal override void Write(CodeWriter writer)
            {
                writer.Append(Declaration);
            }
        }
    }
}
