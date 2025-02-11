// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class DoubleSnippets
    {
        public static ScopedApi<double> MaxValue => Static<double>().Property(nameof(double.MaxValue)).As<double>();

        public static ScopedApi<bool> IsNan(ValueExpression d) => Static<double>().Invoke(nameof(double.IsNaN), [d]).As<bool>();
    }
}
