// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using TypeSpec.Generator.Primitives;
using TypeSpec.Generator.Snippets;
using TypeSpec.Generator.Statements;

namespace TypeSpec.Generator.Expressions
{
    public sealed record ListExpression(CSharpType ElementType, ValueExpression Original) : ValueExpression(Original)
    {
        public MethodBodyStatement Add(ValueExpression item) => Invoke(nameof(List<object>.Add), item).Terminate();

        public IndexableExpression ToArray() => new(Invoke(nameof(List<object>.ToArray)));

        public ValueExpression this[ValueExpression index] => new IndexerExpression(this, index);

        internal override void Write(CodeWriter writer)
        {
            Original.Write(writer);
        }
    }
}
