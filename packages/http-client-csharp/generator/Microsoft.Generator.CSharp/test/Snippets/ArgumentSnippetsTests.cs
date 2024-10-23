// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Snippets
{
    public class ArgumentSnippetsTests
    {

        public ArgumentSnippetsTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void AssertNotNull()
        {
            using CodeWriter writer = new CodeWriter();
            var p = new ParameterProvider("p1", $"p1", new CSharpType(typeof(bool)));


            ArgumentSnippets.AssertNotNull(p).Write(writer);
            Assert.AreEqual("global::Sample.Argument.AssertNotNull(p1, nameof(p1));\n", writer.ToString(false));
        }
    }
}
