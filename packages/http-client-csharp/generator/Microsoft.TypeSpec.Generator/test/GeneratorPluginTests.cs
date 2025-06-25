// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class GeneratorPluginTests
    {
        [Test]
        public void PluginAddsVisitorToGenerator()
        {
            var generator = MockHelpers.LoadMockGenerator();
            var plugin = new TestGeneratorPlugin();

            plugin.Apply(generator.Object);

            Assert.AreEqual(1, generator.Object.Visitors.Count);
            Assert.IsInstanceOf<TestLibraryVisitor>(generator.Object.Visitors[0]);
        }
    }
}
