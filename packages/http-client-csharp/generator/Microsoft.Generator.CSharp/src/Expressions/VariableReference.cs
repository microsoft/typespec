﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record VariableReference(CSharpType Type, CodeWriterDeclaration Declaration) : TypedValueExpression(Type, new FormattableStringToExpression($"{Declaration:I}"))
    {
        public VariableReference(CSharpType type, string name) : this(type, new CodeWriterDeclaration(name)) { }

        private record UntypedVariableReference(CodeWriterDeclaration Declaration) : ValueExpression
        {
            public override void Write(CodeWriter writer)
            {
                writer.Append(Declaration);
            }
        }
    }
}
