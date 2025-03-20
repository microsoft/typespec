// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class IntSnippets
    {
        public static ScopedApi<int> MaxValue => Static<int>().Property(nameof(int.MaxValue)).As<int>();
        public static ScopedApi<int> Add(this ScopedApi<int> intExpression, ScopedApi<int> value) => intExpression.Operator("+", value);
        public static ScopedApi<int> Minus(this ScopedApi<int> intExpression, ScopedApi<int> value) => intExpression.Operator("-", value);
        public static ScopedApi<int> Multiply(this ScopedApi<int> intExpression, ScopedApi<int> value) => intExpression.Operator("*", value);
        public static ScopedApi<int> DivideBy(this ScopedApi<int> intExpression, ScopedApi<int> value) => intExpression.Operator("/", value);

        private static ScopedApi<int> Operator(this ScopedApi<int> intExpression, string op, ScopedApi<int> other) => new BinaryOperatorExpression(op, intExpression, other).As<int>();
    }
}
