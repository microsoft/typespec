// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Moq;
using NUnit.Framework;
using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class JsonMrwSerializationTypeProviderTests
    {
        private readonly string _mocksFolder = "Mocks";
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var mockGeneratorContext = new Mock<GeneratorContext>(Configuration.Load(configFilePath));
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { };

            _mockPlugin?.SetValue(null, mockPluginInstance.Object);
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        [Test]
        public void TestBuildImplements()
        {
            // mock the model type provider
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelTypeProvider(inputModel, null);
            var jsonMrwSerializationTypeProvider = new JsonMrwSerializationTypeProvider(mockModelTypeProvider);
            var interfaces = jsonMrwSerializationTypeProvider.Implements;

            Assert.IsNotNull(interfaces);
            Assert.AreEqual(1, interfaces.Count);

            var expectediJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), mockModelTypeProvider.Type);

            Assert.That(interfaces.Any(i => i.Equals(expectediJsonModelTInterface)));
        }

        // This test validates the json model serialization write method is built correctly
        [Test]
        public void TestBuildJsonModelWriteMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelTypeProvider(inputModel, null);
            var jsonMrwSerializationTypeProvider = new JsonMrwSerializationTypeProvider(mockModelTypeProvider);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelWriteMethod();

            Assert.IsNotNull(method);

            var expectediJsonModelInterface = new CSharpType(typeof(IJsonModel<>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(expectediJsonModelInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);
        }

        // This test validates the json model deserialization create method is built correctly
        [Test]
        public void TestBuildJsonModelCreateMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelTypeProvider(inputModel, null);
            var jsonMrwSerializationTypeProvider = new JsonMrwSerializationTypeProvider(mockModelTypeProvider);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IJsonModel<>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            var expectedReturnType = expectedJsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model serialization write method is built correctly
        [Test]
        public void TestBuildIModelWriteMethodMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelTypeProvider(inputModel, null);
            var jsonMrwSerializationTypeProvider = new JsonMrwSerializationTypeProvider(mockModelTypeProvider);
            var method = jsonMrwSerializationTypeProvider.BuildIModelWriteMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(BinaryData));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model deserialization create method is built correctly
        [Test]
        public void TestBuildIModelDeserializationMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelTypeProvider(inputModel, null);
            var jsonMrwSerializationTypeProvider = new JsonMrwSerializationTypeProvider(mockModelTypeProvider);
            var method = jsonMrwSerializationTypeProvider.BuildIModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            var expectedReturnType = expectedJsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model get format method is built correctly
        [Test]
        public void TestBuildIModelGetFormatMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelTypeProvider(inputModel, null);
            var jsonMrwSerializationTypeProvider = new JsonMrwSerializationTypeProvider(mockModelTypeProvider);
            var method = jsonMrwSerializationTypeProvider.BuildIModelGetFormatFromOptionsMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("GetFormatFromOptions", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(string));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);

            var methodBody = method?.BodyExpression;
            Assert.IsNotNull(methodBody);
        }
    }
}
