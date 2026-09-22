// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class CustomizationTests
    {
        [TestCase("HelloDemo2", "SAMPLE0001", 2)]
        [TestCase("HelloDemo2Async", "SAMPLE0001", 2)]
        [TestCase("DynamicModelOperation", "SAMPLE0002", 2)]
        [TestCase("DynamicModelOperationAsync", "SAMPLE0002", 2)]
        [TestCase("SayHi", null, 2)]
        [TestCase("SayHiAsync", null, 2)]
        [TestCase("CreateHelloDemo2Request", null, 1)]
        [TestCase("CreateDynamicModelOperationRequest", null, 1)]
        public void ExperimentalOperationDiagnosticsAreScopedToPublicApis(string methodName, string? diagnosticId, int overloadCount)
        {
            var methods = typeof(SampleTypeSpecClient)
                .GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Where(method => method.Name == methodName)
                .ToArray();

            Assert.AreEqual(overloadCount, methods.Length);
            foreach (var method in methods)
            {
                Assert.AreEqual(diagnosticId, method.GetCustomAttribute<ExperimentalAttribute>()?.DiagnosticId);
            }
        }

        [Test]
        public void ModelNameIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(SampleTypeSpecClient))!.GetTypes();
            Assert.IsTrue(types.Any(t => t.Name == "RenamedModelCustom"));
        }

        [Test]
        public void ModelNamespaceIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(SampleTypeSpecClient))!.GetTypes();
            var type = types.Single(t => t.Name == "Friend");
            Assert.AreEqual("SampleTypeSpec.Models.Custom", type.Namespace);
        }

        [Test]
        public void ModelPropertyNameIsCustomized()
        {
            var types = Assembly.GetAssembly(typeof(SampleTypeSpecClient))!.GetTypes();
            var type = types.Single(t => t.Name == "Thing");
            var property = type.GetProperty("Rename");
            Assert.IsNotNull(property);
        }
    }
}
