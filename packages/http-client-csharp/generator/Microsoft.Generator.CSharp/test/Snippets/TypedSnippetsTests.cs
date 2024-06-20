// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Snippets
{
    internal class TypedSnippetsTests
    {
        [Test]
        public void ConvertSnippet_InvokeToDouble()
        {
            var arg = Snippet.Literal("2.0");
            InvokeStaticMethodExpression result = ConvertSnippet.InvokeToDouble(arg);

            Assert.IsNotNull(result.MethodType);
            Assert.AreEqual(new CSharpType(typeof(Convert)), result.MethodType);
            Assert.AreEqual(nameof(Convert.ToDouble), result.MethodName);
        }

        [Test]
        public void ConvertSnippet_InvokeToInt32()
        {
            var arg = Snippet.Literal("2");
            InvokeStaticMethodExpression result = ConvertSnippet.InvokeToInt32(arg);

            Assert.IsNotNull(result.MethodType);
            Assert.AreEqual(new CSharpType(typeof(Convert)), result.MethodType);
            Assert.AreEqual(nameof(Convert.ToInt32), result.MethodName);
        }
    }
}
