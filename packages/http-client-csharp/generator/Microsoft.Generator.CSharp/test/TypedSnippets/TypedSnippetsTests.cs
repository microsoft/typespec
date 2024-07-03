// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Snippets
{
    public class TypedSnippetsTests
    {

        public TypedSnippetsTests()
        {
            MockCodeModelPlugin.LoadMockPlugin();
        }

        [Test]
        public void ConvertSnippet_InvokeToDouble()
        {
            var arg = Snippet.Literal("2.0");
            InvokeMethodExpression result = ConvertSnippets.InvokeToDouble(arg);

            Assert.AreEqual(nameof(Convert.ToDouble), result.MethodName);
            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("global::System.Convert.ToDouble(\"2.0\")", writer.ToString(false));
        }

        [Test]
        public void ConvertSnippet_InvokeToInt32()
        {
            var arg = Snippet.Literal("2");
            InvokeMethodExpression result = ConvertSnippets.InvokeToInt32(arg);

            Assert.AreEqual(nameof(Convert.ToInt32), result.MethodName);
            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("global::System.Convert.ToInt32(\"2\")", writer.ToString(false));
        }

        [Test]
        public void ArgumentSnippet_AssertNotNull()
        {
            using CodeWriter writer = new CodeWriter();
            var p = new ParameterProvider("p1", $"p1", new CSharpType(typeof(bool)));


            ArgumentSnippets.AssertNotNull(p).Write(writer);
            Assert.AreEqual("global::Sample.Argument.AssertNotNull(p1, nameof(p1));\n", writer.ToString(false));
        }
    }
}
