// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    internal class MrwSerializationTypeDefinitionTests
    {
        public MrwSerializationTypeDefinitionTests()
        {
            MockHelpers.LoadMockPlugin(getSerializationTypeProviders: inputType => inputType is InputModelType modelType ? [new MrwSerializationTypeDefinition(modelType)] : []);
        }

        [Test]
        public void TestBuildImplements()
        {
            // mock the model type provider
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var interfaces = serializationProvider.Implements;

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("JsonModelWriteCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected;
            if (mockModelTypeProvider.Type.BaseType != null)
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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildJsonModelWriteMethodObjectDeclaration();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildJsonModelCreateMethod();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("JsonModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(mockModelTypeProvider.Type, methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected;
            if (mockModelTypeProvider.Type.BaseType != null)
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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildJsonModelCreateMethodObjectDeclaration();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelWriteMethod();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelWriteCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(BinaryData)), methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected;
            if (mockModelTypeProvider.Type.BaseType != null)
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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelWriteMethodObjectDeclaration();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelCreateMethod();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);

            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);
            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];

            Assert.IsNotNull(serializationProvider);

            var method = serializationProvider.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(mockModelTypeProvider.Type, methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");

            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }

        // This test validates the persistable model serialization create core method is built correctly for derived models
        [Test]
        public void TestBuildPersistableModelCreateCoreMethod_DerivedType()
        {
            var baseModel = new InputModelType("mockBaseModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, [], null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var derivedModel = new InputModelType("mockDerivedModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip,
                [], baseModel, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            ((List<InputModelType>)baseModel.DerivedModels).Add(derivedModel);
            var derivedType = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(derivedModel);
            var baseType = derivedType.BaseType;
            var mockDerivedModelTypeProvider = ClientModelPlugin.Instance.TypeFactory.GetProvider(derivedType)!;
            Assert.IsNotNull(mockDerivedModelTypeProvider);
            var derivedSerializationProviders = mockDerivedModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, derivedSerializationProviders.Count);

            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(derivedSerializationProviders[0]);
            var derivedSerializationProvider = (MrwSerializationTypeDefinition)derivedSerializationProviders[0];

            var method = derivedSerializationProvider.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            // for derived model, the return type of this method should be the same as the overridden base method
            Assert.AreEqual(baseType, methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelCreateMethodObjectDeclaration();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelCreateMethod();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelGetFormatFromOptionsMethod();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var method = serializationProvider.BuildPersistableModelGetFormatFromOptionsObjectDeclaration();

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
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = mockModelTypeProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var constructor = serializationProvider.BuildSerializationConstructor();

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
            var model =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = model.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var fields = serializationProvider.Fields;

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

            var modelProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = modelProvider.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];
            var ctors = serializationProvider.Constructors;
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
            var model =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializationProviders = model.SerializationProviders;

            Assert.AreEqual(1, serializationProviders.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializationProviders[0]);

            var serializationProvider = (MrwSerializationTypeDefinition)serializationProviders[0];

            // Assert
            Assert.IsNotNull(serializationProvider);

            var deserializationMethod = serializationProvider.BuildDeserializationMethod();
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

        [Test]
        public void TestBuildImplicitToBinaryContent()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(inputModel);
            var methods = jsonMrwSerializationTypeProvider.Methods;

            Assert.IsTrue(methods.Count > 0);

            var method = methods.FirstOrDefault(m => m.Signature.Name == nameof(BinaryContent));

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);

            var expectedModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Implicit | MethodSignatureModifiers.Operator;
            Assert.AreEqual(nameof(BinaryContent), methodSignature?.Name);
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers);

            var methodParameters = methodSignature?.Parameters;
            Assert.AreEqual(1, methodParameters?.Count);
            Assert.IsNull(methodSignature?.ReturnType);

            var methodBody = method?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }

        [Test]
        public void TestBuildExplicitFromClientResult()
        {
            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, Array.Empty<InputModelProperty>(), null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var mockModelTypeProvider =  ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var jsonMrwSerializationTypeProvider = new MrwSerializationTypeDefinition(inputModel);
            var methods = jsonMrwSerializationTypeProvider.Methods;

            Assert.IsTrue(methods.Count > 0);

            var method = methods.FirstOrDefault(m => m.Signature.Name == "MockInputModel");

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);

            var expectedModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Explicit | MethodSignatureModifiers.Operator;
            Assert.AreEqual(inputModel.Name.FirstCharToUpperCase(), methodSignature?.Name);
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers);

            var methodParameters = methodSignature?.Parameters;
            Assert.AreEqual(1, methodParameters?.Count);
            var clientResultParameter = methodParameters?[0];
            Assert.AreEqual(new CSharpType(typeof(ClientResult)), clientResultParameter?.Type);
            Assert.IsNull(methodSignature?.ReturnType);

            var methodBody = method?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }

        [Test]
        public void TestBuildConstructors()
        {
            var baseProperties = new List<InputModelProperty>
            {
                new InputModelProperty("prop1", "prop1", string.Empty, InputPrimitiveType.String, true, false, false),
                new InputModelProperty("prop2", "prop2", string.Empty, InputPrimitiveType.String, false, false, false),
            };
            var derivedProperties = new List<InputModelProperty>
            {
                new InputModelProperty("prop3", "prop3", string.Empty, InputPrimitiveType.String, true, false, false),
                new InputModelProperty("prop4", "prop4", string.Empty, InputPrimitiveType.String, false, false, false),
            };
            var inputBase = new InputModelType("baseModel", "baseModel", null, null, null, InputModelTypeUsage.Input, baseProperties, null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var inputDerived = new InputModelType("derivedModel", "derivedModel", null, null, null, InputModelTypeUsage.Input, derivedProperties, inputBase, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            ((List<InputModelType>)inputBase.DerivedModels).Add(inputDerived);

            var baseModel = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputDerived);

            var baseSerialization = baseModel.SerializationProviders.First();
            var derivedSerialization = derivedModel.SerializationProviders.First();

            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(baseSerialization);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(derivedSerialization);

            var baseCtors = baseSerialization.Constructors;
            var derivedCtors = derivedSerialization.Constructors;
            Assert.AreEqual(2, baseCtors.Count);
            Assert.AreEqual(2, derivedCtors.Count);
            // the second ctor of the ctors should be parameterless
            Assert.AreEqual(0, baseCtors[1].Signature.Parameters.Count);
            Assert.AreEqual(0, derivedCtors[1].Signature.Parameters.Count);
            // the first ctor should contain certain number of parameters
            var baseParameters = baseCtors[0].Signature.Parameters;
            var derivedParameters = derivedCtors[0].Signature.Parameters;
            Assert.AreEqual(3, baseParameters.Count); // 2 properties + raw data
            Assert.AreEqual(5, derivedParameters.Count); // 4 properties + raw data
            Assert.AreEqual("prop1", baseParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), baseParameters[0].Type);
            Assert.AreEqual("prop2", baseParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), baseParameters[1].Type);
            Assert.AreEqual("serializedAdditionalRawData", baseParameters[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), baseParameters[2].Type);
            Assert.AreEqual("prop1", baseParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[0].Type);
            Assert.AreEqual("prop2", baseParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), derivedParameters[1].Type);
            Assert.AreEqual("serializedAdditionalRawData", derivedParameters[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), derivedParameters[2].Type);
            Assert.AreEqual("prop3", derivedParameters[3].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[3].Type);
            Assert.AreEqual("prop4", derivedParameters[4].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), derivedParameters[4].Type);
        }
    }
}
