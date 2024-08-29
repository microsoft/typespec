// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Expressions
{
    internal class TypeOfExpressionTests
    {
        [TestCase(typeof(int), "typeof(int)")]
        [TestCase(typeof(List<string>), "typeof(global::System.Collections.Generic.List<string>)")]
        [TestCase(typeof(Dictionary<string, int>), "typeof(global::System.Collections.Generic.Dictionary<string, int>)")]
        [TestCase(typeof(Dictionary<string, List<int>>), "typeof(global::System.Collections.Generic.Dictionary<string, global::System.Collections.Generic.List<int>>)")]
        public void TypeOfStatement(Type type, string expected)
        {
            var result = TypeOf(type);
            using var writer = new CodeWriter();
            result.Write(writer);

            Assert.AreEqual(expected, writer.ToString(false));
        }
    }
}
