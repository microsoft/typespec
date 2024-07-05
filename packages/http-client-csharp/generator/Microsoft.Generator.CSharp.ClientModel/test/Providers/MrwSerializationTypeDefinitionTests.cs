// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using Moq.Protected;
using NUnit.Framework;
using System.Text.Json;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    internal class MrwSerializationTypeDefinitionTests
    {
        private readonly string _mocksFolder = "Mocks";
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            var mockTypeFactory = new Mock<ScmTypeFactory>() { };
            mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns(new CSharpType(typeof(int)));
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object?[] parameters = [configFilePath, null];
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
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var interfaces = jsonMrwSerializationTypeProvider.Implements;

            Assert.IsNotNull(interfaces);
            Assert.AreEqual(1, interfaces.Count);

            var expectedJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), mockModelTypeProvider.Type);

            Assert.That(interfaces.Any(i => i.Equals(expectedJsonModelTInterface)));
        }

        // This test validates the json model serialization write method is built correctly
        [Test]
        public void TestBuildJsonModelWriteCoreMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("JsonModelWriteCore", methodSignature?.Name);
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

        // This test validates the json model serialization write method object declaration is built correctly
        [Test]
        public void TestBuildJsonModelWriteMethodObjectDeclaration()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, true);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelWriteMethodObjectDeclaration();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);

            var explicitInterface = new CSharpType(typeof(IJsonModel<object>));
            Assert.AreEqual(explicitInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.None;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");


            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNull(methodBody);
            var bodyExpression = method?.BodyExpression as InvokeMethodExpression;
            Assert.IsNotNull(bodyExpression);
            Assert.AreEqual("Write", bodyExpression?.MethodName);
            Assert.IsNotNull(bodyExpression?.InstanceReference);
            Assert.AreEqual(2, bodyExpression?.Arguments.Count);
        }

        // This test validates the json model deserialization create method is built correctly
        [Test]
        public void TestBuildJsonModelCreateMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IJsonModel<>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            var expectedReturnType = expectedJsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the json model serialization create core method is built correctly
        [Test]
        public void TestBuildJsonModelCreateCoreMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("JsonModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(mockModelTypeProvider.Type, methodSignature?.ReturnType);

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

        // This test validates the JsonModel serialization create method object declaration is built correctly
        [Test]
        public void TestBuildJsonModelCreateMethodObjectDeclaration()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, true);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildJsonModelCreateMethodObjectDeclaration();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);

            var explicitInterface = new CSharpType(typeof(IJsonModel<object>));
            Assert.AreEqual(explicitInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(object)), methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.None;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");


            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNull(methodBody);
            var bodyExpression = method?.BodyExpression as InvokeMethodExpression;
            Assert.IsNotNull(bodyExpression);
            Assert.AreEqual("Create", bodyExpression?.MethodName);
            Assert.IsNotNull(bodyExpression?.InstanceReference);
            Assert.AreEqual(2, bodyExpression?.Arguments.Count);
        }


        // This test validates the PersistableModel serialization write method is built correctly
        [Test]
        public void TestBuildPersistableModelWriteMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelWriteMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(BinaryData));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the persistable model serialization write core method is built correctly
        [Test]
        public void TestBuildPersistableModelWriteCoreMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelWriteCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(BinaryData)), methodSignature?.ReturnType);

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

        // This test validates the PersistableModel serialization write method object declaration is built correctly
        [Test]
        public void TestBuildPersistableModelWriteMethodObjectDeclaration()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, true);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelWriteMethodObjectDeclaration();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);

            var explicitInterface = new CSharpType(typeof(IPersistableModel<object>));
            Assert.AreEqual(explicitInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(BinaryData)), methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.None;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");


            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNull(methodBody);
            var bodyExpression = method?.BodyExpression as InvokeMethodExpression;
            Assert.IsNotNull(bodyExpression);
            Assert.AreEqual("Write", bodyExpression?.MethodName);
            Assert.IsNotNull(bodyExpression?.InstanceReference);
            Assert.AreEqual(1, bodyExpression?.Arguments.Count);
        }

        // This test validates the PersistableModel serialization create method is built correctly
        [Test]
        public void TestBuildPersistableModelCreateMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(mockModelTypeProvider.Type, methodSignature?.ReturnType);

            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNull(methodBody);
            var bodyExpression = method?.BodyExpression as InvokeMethodExpression;
            Assert.IsNotNull(bodyExpression);
            Assert.AreEqual("PersistableModelCreateCore", bodyExpression?.MethodName);
            Assert.IsNotNull(bodyExpression?.InstanceReference);
            Assert.AreEqual(2, bodyExpression?.Arguments.Count);
        }

        // This test validates the persistable model serialization create core method is built correctly
        [Test]
        public void TestBuildPersistableModelCreateCoreMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(mockModelTypeProvider.Type, methodSignature?.ReturnType);

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

        // This test validates the PersistableModel serialization Create method object declaration is built correctly
        [Test]
        public void BuildPersistableModelCreateMethodObjectDeclaration()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, true);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelCreateMethodObjectDeclaration();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);

            var explicitInterface = new CSharpType(typeof(IPersistableModel<object>));
            Assert.AreEqual(explicitInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(object)), methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.None;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");


            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNull(methodBody);
            var bodyExpression = method?.BodyExpression as InvokeMethodExpression;
            Assert.IsNotNull(bodyExpression);
            Assert.AreEqual("Create", bodyExpression?.MethodName);
            Assert.IsNotNull(bodyExpression?.InstanceReference);
            Assert.AreEqual(2, bodyExpression?.Arguments.Count);
        }

        // This test validates the I model deserialization create method is built correctly
        [Test]
        public void TestBuildPersistableModelDeserializationMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            var expectedReturnType = expectedJsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the persistable model get format method is built correctly
        [Test]
        public void TestBuildPersistableModelGetFormatMethod()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelGetFormatFromOptionsMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), mockModelTypeProvider.Type);
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("GetFormatFromOptions", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(string));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);

            var methodBody = method?.BodyExpression;
            Assert.IsNotNull(methodBody);
        }

        // This test validates the persistable model get format method object declaration is built correctly
        [Test]
        public void TestBuildPersistableModelGetFormatMethodObjectDeclaration()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, true);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var method = jsonMrwSerializationTypeProvider.BuildPersistableModelGetFormatFromOptionsObjectDeclaration();

            Assert.IsNotNull(method);

            var expectedInterface = new CSharpType(typeof(IPersistableModel<object>));
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("GetFormatFromOptions", methodSignature?.Name);
            Assert.AreEqual(expectedInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(string));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.None;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");


            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNull(methodBody);
            var bodyExpression = method?.BodyExpression as InvokeMethodExpression;
            Assert.IsNotNull(bodyExpression);
            Assert.AreEqual("GetFormatFromOptions", bodyExpression?.MethodName);
            Assert.IsNotNull(bodyExpression?.InstanceReference);
            Assert.AreEqual(1, bodyExpression?.Arguments.Count);
        }

        [Test]
        public void TestBuildSerializationConstructor()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = new ModelProvider(inputModel);
            var MrwSerializationTypeProvider = new MrwSerializationTypeDefinition(mockModelTypeProvider, inputModel);
            var constructor = MrwSerializationTypeProvider.BuildSerializationConstructor();

            Assert.IsNotNull(constructor);
            var constructorSignature = constructor?.Signature;
            Assert.IsNotNull(constructorSignature);
            Assert.AreEqual(1, constructorSignature?.Parameters.Count);

            var param = constructorSignature?.Parameters[0];
            Assert.IsNotNull(param);
            Assert.AreEqual("serializedAdditionalRawData", param?.Name);
        }

        [Test]
        public void TestBuildFields()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var model = new ModelProvider(inputModel);
            var typeProvider = new MrwSerializationTypeDefinition(model, inputModel);
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
                    new InputModelProperty("requiredCollection", "requiredCollection", "", new InputArrayType("List", "TypeSpec.Array", new InputPrimitiveType(InputPrimitiveTypeKind.String)), true, false, false),
                    new InputModelProperty("requiredDictionary", "requiredDictionary", "", new InputDictionaryType("Dictionary", new InputPrimitiveType(InputPrimitiveTypeKind.String), new InputPrimitiveType(InputPrimitiveTypeKind.String)), true, false, false),
             };

            var inputModel = new InputModelType("TestModel", "TestModel", "public", null, "Test model.", InputModelTypeUsage.RoundTrip, properties, null, Array.Empty<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);

            var ModelProvider = new ModelProvider(inputModel);
            var serializationModelTypeProvider = new MrwSerializationTypeDefinition(ModelProvider, inputModel);
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
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var model = new ModelProvider(inputModel);
            var provider = new MrwSerializationTypeDefinition(model, inputModel);

            // Assert
            Assert.IsNotNull(provider);

            var deserializationMethod = provider.BuildDeserializationMethod();
            Assert.IsNotNull(deserializationMethod);

            var signature = deserializationMethod?.Signature;
            Assert.IsNotNull(signature);
            Assert.AreEqual($"Deserialize{model.Name}", signature?.Name);
            Assert.AreEqual(2, signature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(JsonElement)), signature?.Parameters[0].Type);
            Assert.AreEqual(new CSharpType(typeof(ModelReaderWriterOptions)), signature?.Parameters[1].Type);
            Assert.AreEqual(model.Type, signature?.ReturnType);
            Assert.AreEqual(MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, signature?.Modifiers);

            var methodBody = deserializationMethod?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }
    }
}
