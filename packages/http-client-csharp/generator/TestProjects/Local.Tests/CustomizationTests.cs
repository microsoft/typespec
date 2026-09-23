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
        [TestCase("SampleTypeSpec.PreviewDetails", "SAMPLE0003")]
        [TestCase("SampleTypeSpec.PreviewChoice", "SAMPLE0004")]
        [TestCase("SampleTypeSpec.PreviewExtensibleChoice", "SAMPLE0005")]
        [TestCase("SampleTypeSpec.ExperimentalSamples", "SAMPLE0009")]
        [TestCase("SampleTypeSpec.LifecycleModel", null)]
        public void ExperimentalTypeDiagnostics(string typeName, string? diagnosticId)
        {
            var type = typeof(SampleTypeSpecClient).Assembly.GetType(typeName);
            Assert.IsNotNull(type);
            Assert.AreEqual(diagnosticId, type!.GetCustomAttribute<ExperimentalAttribute>()?.DiagnosticId);
        }

        [TestCase("SampleTypeSpec.PreviewChoice", "Two", "SAMPLE0007")]
        [TestCase("SampleTypeSpec.PreviewExtensibleChoice", "Two", "SAMPLE0006")]
        [TestCase("SampleTypeSpec.LifecycleModel", "Preview", "SAMPLE0008")]
        [TestCase("SampleTypeSpec.SampleTypeSpecModelFactory", "PreviewDetails", "SAMPLE0003")]
        [TestCase("SampleTypeSpec.PreviewChoice", "One", null)]
        [TestCase("SampleTypeSpec.PreviewExtensibleChoice", "One", null)]
        [TestCase("SampleTypeSpec.SampleTypeSpecClientOptions+ServiceVersion", "V2024_08_16_Preview", "SAMPLE0010")]
        public void ExperimentalMemberDiagnostics(string typeName, string memberName, string? diagnosticId)
        {
            var type = typeof(SampleTypeSpecClient).Assembly.GetType(typeName);
            Assert.IsNotNull(type);
            var member = type!.GetMember(memberName).Single();
            Assert.AreEqual(diagnosticId, member.GetCustomAttribute<ExperimentalAttribute>()?.DiagnosticId);
        }

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
