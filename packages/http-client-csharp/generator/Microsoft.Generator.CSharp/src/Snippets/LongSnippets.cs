// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class LongSnippets
    {
        public static StringSnippet InvokeToString(this ScopedApi<long> longExpression, ValueExpression formatProvider)
            => new(longExpression.Invoke(nameof(long.ToString), formatProvider));

        public static ScopedApi<long> Parse(StringSnippet value, ValueExpression formatProvider)
            => Static<long>().Invoke(nameof(long.Parse), [value, formatProvider]).As<long>();
    }
}
