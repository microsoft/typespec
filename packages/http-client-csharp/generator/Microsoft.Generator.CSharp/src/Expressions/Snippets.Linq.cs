// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;

namespace Microsoft.Generator.CSharp.Expressions
{
    public static partial class Snippets
    {
        public static class Linq
        {
            public static ValueExpression ToList(ValueExpression expression)
            {
                return new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.ToList), new[] { expression }, CallAsExtension: true);
            }
        }
    }
}
