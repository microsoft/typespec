// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using NUnit.Framework;
using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Formats.Asn1;
using System.IO;
using System.Linq;
using System.Reflection;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class MrwSerializationTypeProviderTests
    {
        private readonly string _mocksFolder = "Mocks";
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            var mockTypeFactory = new Mock<TypeFactory>() { };
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(new CSharpType(typeof(int)));
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object[] parameters = new object[] { configFilePath, null! };
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

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
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
            var interfaces = jsonMrwSerializationTypeProvider.Implements;

            Assert.IsNotNull(interfaces);
            Assert.AreEqual(1, interfaces.Count);

            var expectedJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), mockModelTypeProvider.Type);

            Assert.That(interfaces.Any(i => i.Equals(expectedJsonModelTInterface)));
        }

        // This test validates the json model serialization write method is built correctly
        [Test]
        public void TestBuildJsonModelWriteMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelWriteMethod();

            Assert.IsNotNull(method);

            var expectedJsonModelInterface = new CSharpType(typeof(IJsonModel<>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(expectedJsonModelInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);
        }

        // This test validates the json model deserialization create method is built correctly
        [Test]
        public void TestBuildJsonModelCreateMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
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
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
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
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
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
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
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

        [Test]
        public void TestBuildSerializationConstructor()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var MrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
            var constructor = MrwSerializationTypeProvider.BuildSerializationConstructor();

            Assert.IsNotNull(constructor);
            var constructorSignature = constructor?.Signature as ConstructorSignature;
            Assert.IsNotNull(constructorSignature);
            Assert.AreEqual(1, constructorSignature?.Parameters.Count);

            var param = constructorSignature?.Parameters[0];
            Assert.IsNotNull(param);
            Assert.AreEqual("serializedAdditionalRawData", param?.Name);
        }

        [Test]
        public void TestBuildFields()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var model = new ModelProvider(inputModel);
            var typeProvider = new MrwSerializationTypeProvider(model, inputModel);
            var fields = typeProvider.Fields;

            // Assert
            Assert.IsNotNull(fields);
            Assert.AreEqual(1, fields.Count);
            Assert.AreEqual("_serializedAdditionalRawData", fields[0].Name);

            var type = fields[0].Type;
            Assert.IsTrue(type.IsCollection);
        }

        [Test]
        public void TestBuildConstructor_ValidateConstructors()
        {
            var properties = new List<InputModelProperty>{
                    new InputModelProperty("requiredString", "requiredString", "", InputPrimitiveType.String, true, false, false),
                    new InputModelProperty("OptionalInt", "optionalInt", "", InputPrimitiveType.Int32, false, false, false),
                    new InputModelProperty("requiredCollection", "requiredCollection", "", new InputListType("List", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false), true, false, false),
                    new InputModelProperty("requiredDictionary", "requiredDictionary", "", new InputDictionaryType("Dictionary", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false), true, false, false),
             };

            var inputModel = new InputModelType("TestModel", "TestModel", "public", null, "Test model.", InputModelTypeUsage.RoundTrip, properties, null, Array.Empty<InputModelType>(), null, null, null, false);

            var ModelProvider = new ModelProvider(inputModel);
            var serializationModelTypeProvider = new MrwSerializationTypeProvider(ModelProvider, inputModel);
            var ctors = serializationModelTypeProvider.Constructors;
            Assert.IsNotNull(ctors);

            Assert.AreEqual(2, ctors.Count);

            var serializationCtor = ctors[0];
            Assert.AreEqual(MethodSignatureModifiers.Internal, serializationCtor.Signature.Modifiers);
            Assert.AreEqual(5, serializationCtor.Signature.Parameters.Count);

            var emptyCtor = ctors[1];
            Assert.AreEqual(MethodSignatureModifiers.Internal, emptyCtor.Signature.Modifiers);
            Assert.AreEqual(0, emptyCtor.Signature.Parameters.Count);
        }
    }
}
