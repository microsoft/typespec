// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class PluginTests
    {
        [Test]
        public void CanAddVisitors()
        {
            var plugin = new TestPlugin();
            plugin.AddVisitor(new TestLibraryVisitor());
            Assert.AreEqual(1, plugin.Visitors.Count);
        }
    }
}
