// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Reflection;
using Microsoft.Generator.CSharp.Expressions;
using Moq;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Expressions.ExtensibleSnippets;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class SerializationMethodsBuilderTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private TypeFactory _typeFactory;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private readonly string _mocksFolder = "mocks";
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var mockSerializationInterfaces = new MockSerializationInterfaces();
            var mockTypeFactory = new Mock<TypeFactory>() { };
            mockTypeFactory.Setup(t => t.GetSerializationInterfaces(It.IsAny<ModelTypeSerializationProvider>(), It.IsAny<bool>(), It.IsAny<bool>())).Returns(mockSerializationInterfaces);
            _typeFactory = mockTypeFactory.Object;

            var mockExtensibleSnippet = new Mock<ExtensibleSnippets>() { };
            var mockModelSnippet = new Mock<ModelSnippets>() { };

            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var mockGeneratorContext = new Mock<GeneratorContext>(Configuration.Load(configFilePath));
            var mockPluginInstance = new Mock<CodeModelPlugin>(mockGeneratorContext.Object) { };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(_typeFactory);

            _mockPlugin?.SetValue(null, mockPluginInstance.Object);
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        // Validates that no serialization methods are built when no interfaces are provided
        [Test]
        public void TestBuildJsonSerializationMethods_NoInterfaces()
        {
            var mockSerializationInterfaces = new MockSerializationInterfaces();
            var serializationMethods = SerializationMethodsBuilder.BuildJsonSerializationMethods(mockSerializationInterfaces);
            Assert.IsEmpty(serializationMethods);
        }

        // Validates that no I model methods are built when no interfaces are provided
        [Test]
        public void TestBuildBuildIModelMethods_NoInterfaces()
        {
            var mockSerializationInterfaces = new MockSerializationInterfaces();
            var wireFormat = Snippets.Literal("test");
            var serializationMethods = SerializationMethodsBuilder.BuildIModelMethods(mockSerializationInterfaces, wireFormat);
            Assert.IsEmpty(serializationMethods);
        }

        public class MockSerializationInterfaces : SerializationInterfaces
        {
            public MockSerializationInterfaces() : base(null!, false, false)
            {
            }
            public MockSerializationInterfaces(TypeProvider typeProvider) : base(typeProvider, true, false)
            {
            }
        }
    }
}
