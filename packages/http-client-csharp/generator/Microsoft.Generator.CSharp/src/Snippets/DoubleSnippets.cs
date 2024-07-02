// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class DoubleSnippets
    {
        public static ScopedApi<double> MaxValue => Static<double>().Property(nameof(double.MaxValue)).As<double>();

        public static ScopedApi<bool> IsNan(ValueExpression d) => Static<double>().Invoke(nameof(double.IsNaN), [d]).As<bool>();
    }
}
