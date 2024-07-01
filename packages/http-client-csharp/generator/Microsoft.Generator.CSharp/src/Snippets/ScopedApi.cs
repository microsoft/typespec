// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record ScopedApi<T>(ValueExpression Expression) : ValueExpression
    {
        public CSharpType Type { get; } = typeof(T);

        internal override void Write(CodeWriter writer)
        {
            Expression.Write(writer);
        }

        protected internal override bool IsEmptyExpression() => Expression.IsEmptyExpression();
    }
}
