// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using NUnit.Framework;
using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;

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

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("WriteCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected;
            if (mockModelTypeProvider.Inherits != null)
            {
                expectedModifiers |= MethodSignatureModifiers.Override;
            }
            else
            {
                expectedModifiers |= MethodSignatureModifiers.Virtual;
            }
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");


            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNotNull(methodBody);
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

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("CreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(mockModelTypeProvider.Type, methodSignature?.ReturnType);
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

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("WriteCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(BinaryData));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model create method is built correctly
        [Test]
        public void TestBuildIModelCreateMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeProvider(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildIModelCreateMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("CreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(mockModelTypeProvider.Type, methodSignature?.ReturnType);
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

            var modelProvider = new ModelProvider(inputModel);
            var serializationModelTypeProvider = new MrwSerializationTypeProvider(modelProvider, inputModel);
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

        [Test]
        public void TestBuildDeserializationMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var model = new ModelProvider(inputModel);
            var provider = new MrwSerializationTypeProvider(model, inputModel);

            // Assert
            Assert.IsNotNull(provider);

            var deserializationMethod = provider.BuildDeserializationMethod();
            Assert.IsNotNull(deserializationMethod);

            var signature = deserializationMethod?.Signature as MethodSignature;
            Assert.IsNotNull(signature);
            Assert.AreEqual($"Deserialize{model.Name}", signature?.Name);
            Assert.AreEqual(2, signature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(JsonElement)), signature?.Parameters[0].Type);
            Assert.AreEqual(new CSharpType(typeof(ModelReaderWriterOptions), isNullable: true), signature?.Parameters[1].Type);
            Assert.AreEqual(model.Type, signature?.ReturnType);
            Assert.AreEqual(MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, signature?.Modifiers);

            var methodBody = deserializationMethod?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }

        [Test]
        public void TestBuildFromOperationResponseMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var model = new ModelProvider(inputModel);
            var provider = new MrwSerializationTypeProvider(model, inputModel);

            // Assert
            Assert.IsNotNull(provider);

            var fromOpResponseMethod = provider.BuildFromOperationResponseMethod();
            Assert.IsNotNull(fromOpResponseMethod);

            var signature = fromOpResponseMethod?.Signature as MethodSignature;
            Assert.IsNotNull(signature);
            Assert.AreEqual($"FromResponse", signature?.Name);
            Assert.AreEqual(1, signature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(PipelineResponse)), signature?.Parameters[0].Type);
            Assert.AreEqual(model.Type, signature?.ReturnType);
            Assert.AreEqual(MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, signature?.Modifiers);

            var methodBody = fromOpResponseMethod?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }

        [Test]
        public void TestBuildToBinaryContentMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, null, false);
            var model = new ModelProvider(inputModel);
            var provider = new MrwSerializationTypeProvider(model, inputModel);

            // Assert
            Assert.IsNotNull(provider);

            var fromOpResponseMethod = provider.BuildToBinaryContentMethod();
            Assert.IsNotNull(fromOpResponseMethod);

            var signature = fromOpResponseMethod?.Signature as MethodSignature;
            Assert.IsNotNull(signature);
            Assert.AreEqual($"ToBinaryContent", signature?.Name);
            Assert.AreEqual(0, signature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(BinaryContent)), signature?.ReturnType);
            Assert.AreEqual(MethodSignatureModifiers.Internal | MethodSignatureModifiers.Virtual, signature?.Modifiers);

            var methodBody = fromOpResponseMethod?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }
    }
}
