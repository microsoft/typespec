// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public record VariableExpression(CSharpType Type, CodeWriterDeclaration Declaration) : ValueExpression
    {
        [Obsolete("Use ArgumentExpression for ref/out argument semantics.")]
        public bool IsRef { get; private set; }

        [Obsolete("Use ArgumentExpression for ref/out argument semantics.")]
        public bool IsOut { get; private set; }

        public CSharpType Type { get; private set; } = Type;
        public CodeWriterDeclaration Declaration { get; private set; } = Declaration;

        [Obsolete("Use ArgumentExpression for ref/out argument semantics. Use VariableExpression(CSharpType, string) instead.")]
        public VariableExpression(CSharpType type, string name, bool isRef = false, bool isOut = false)
            : this(type, new CodeWriterDeclaration(name))
        {
            IsRef = isRef;
            IsOut = isOut;
        }

        public VariableExpression(CSharpType type, string name)
            : this(type, new CodeWriterDeclaration(name))
        {
        }

        internal override void Write(CodeWriter writer)
        {
            writer.Append(Declaration);
        }

        internal override VariableExpression Accept(LibraryVisitor visitor, MethodProvider method)
        {
            return visitor.VisitVariableExpression(this, method);
        }

        public void Update(CSharpType? type = null, string? name = null, bool? isRef = null, bool? isOut = null)
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
#pragma warning disable CS0618 // Obsolete
                IsRef = isRef.Value;
#pragma warning restore CS0618
            }

            if (isOut != null)
            {
#pragma warning disable CS0618 // Obsolete
                IsOut = isOut.Value;
#pragma warning restore CS0618
            }
        }
    }
}
