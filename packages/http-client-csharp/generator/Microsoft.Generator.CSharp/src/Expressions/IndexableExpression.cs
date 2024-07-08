// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Snippets
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
