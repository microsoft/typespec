// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public record VariableExpression(CSharpType Type, CodeWriterDeclaration Declaration) : ValueExpression
    {
        public VariableExpression(CSharpType type, string name) : this(type, new CodeWriterDeclaration(name)) { }

        internal override void Write(CodeWriter writer)
        {
            writer.Append(Declaration);
        }

        public ValueExpression NullConditional() => Type.IsNullable ? new NullConditionalExpression(this) : this;
    }
}
