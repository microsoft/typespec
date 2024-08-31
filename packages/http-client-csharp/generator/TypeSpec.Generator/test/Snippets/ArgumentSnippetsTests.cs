// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Primitives;
using TypeSpec.Generator.Providers;
using TypeSpec.Generator.Snippets;
using NUnit.Framework;

namespace TypeSpec.Generator.Tests.Snippets
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
