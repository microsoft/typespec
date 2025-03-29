// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Reflection;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class CustomizationTests
    {
        [Test]
        public void ModelNameIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(UnbrandedTypeSpecClient))!.GetTypes();
            Assert.IsTrue(types.Any(t => t.Name == "RenamedModelCustom"));
        }

        [Test]
        public void ModelNamespaceIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(UnbrandedTypeSpecClient))!.GetTypes();
            var type = types.Single(t => t.Name == "Friend");
            Assert.AreEqual("UnbrandedTypeSpec.Models.Custom", type.Namespace);
        }

        [Test]
        public void ModelPropertyNameIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(UnbrandedTypeSpecClient))!.GetTypes();
            var type = types.Single(t => t.Name == "Thing");
            var property = type.GetProperty("Rename");
            Assert.IsNotNull(property);
        }
    }
}
