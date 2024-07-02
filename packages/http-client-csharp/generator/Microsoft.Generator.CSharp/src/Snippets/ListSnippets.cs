// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class ListSnippets
    {
        public static MethodBodyStatement Add<T>(this ScopedApi<List<T>> listExpression, ValueExpression item)
            => listExpression.Invoke(nameof(List<T>.Add), item).Terminate();

        public static IndexableExpression ToArray<T>(this ScopedApi<List<T>> listExpression)
            => new(listExpression.Invoke(nameof(List<T>.ToArray)));

        public static ValueExpression Index<T>(this ScopedApi<List<T>> listExpression, ValueExpression index)
            => new IndexerExpression(listExpression, index);
    }
}
