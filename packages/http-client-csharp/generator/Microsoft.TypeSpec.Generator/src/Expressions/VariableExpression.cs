// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public record VariableExpression(CSharpType Type, CodeWriterDeclaration Declaration, bool IsRef = false) : ValueExpression
    {
        public CSharpType Type { get; private set; } = Type;
        public CodeWriterDeclaration Declaration { get; private set; } = Declaration;
        public bool IsRef { get; private set; } = IsRef;
        public VariableExpression(CSharpType type, string name, bool isRef = false) : this(type, new CodeWriterDeclaration(name), isRef) { }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("ref ", IsRef);
            writer.Append(Declaration);
        }

        internal override VariableExpression Accept(LibraryVisitor visitor, MethodProvider method)
        {
            return visitor.VisitVariableExpression(this, method);
        }

        public void Update(CSharpType? type = null, string? name = null, bool? isRef = null)
        {
            if (type != null)
            {
                Type = type;
            }
            if (name != null)
            {
                Declaration = new CodeWriterDeclaration(name);
            }
            if (isRef != null)
            {
                IsRef = isRef.Value;
            }
        }
    }
}
