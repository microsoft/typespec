// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public record IndexableExpression(ValueExpression Original) : ValueExpression(Original)
    {
        public IndexableExpression(CSharpType type, string name) : this(new VariableExpression(type, name))
        {
        }

        public ValueExpression this[ValueExpression index] => new IndexerExpression(this, index);

        internal override void Write(CodeWriter writer)
        {
            Original.Write(writer);
        }
    }
}
