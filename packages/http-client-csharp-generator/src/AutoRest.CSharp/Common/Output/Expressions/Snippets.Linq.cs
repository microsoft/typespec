// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal static partial class Snippets
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
