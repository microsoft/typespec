// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Expressions;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.Snippets
{
    public static class DoubleSnippets
    {
        public static ScopedApi<double> MaxValue => Static<double>().Property(nameof(double.MaxValue)).As<double>();

        public static ScopedApi<bool> IsNan(ValueExpression d) => Static<double>().Invoke(nameof(double.IsNaN), [d]).As<bool>();
    }
}
