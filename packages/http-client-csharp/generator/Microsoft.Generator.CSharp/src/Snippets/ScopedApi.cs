// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Snippets
{
    public record ScopedApi(CSharpType Type, ValueExpression Original) : ValueExpression(Original)
    {
        internal override void Write(CodeWriter writer)
        {
            Original.Write(writer);
        }

        protected internal override bool IsEmptyExpression() => Original.IsEmptyExpression();
    }
}
