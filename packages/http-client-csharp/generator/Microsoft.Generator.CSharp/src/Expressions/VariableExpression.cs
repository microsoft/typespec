// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record VariableExpression(CSharpType Type, CodeWriterDeclaration Declaration, bool IsRef = false) : ValueExpression
    {
        public VariableExpression(CSharpType type, string name) : this(type, new CodeWriterDeclaration(name)) { }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("ref ", IsRef);
            writer.Append(Declaration);
        }

        public ValueExpression NullConditional() => Type.IsNullable ? new NullConditionalExpression(this) : this;
    }
}
