// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using NUnit.Framework;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal static partial class Snippets
    {
        public static class Assertions
        {
            public static MethodBodyStatement IsNotNull(ValueExpression target)
                => new InvokeStaticMethodStatement(typeof(Assert), nameof(Assert.IsNotNull), target);
        }
    }
}
