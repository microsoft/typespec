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
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    internal class MrwSerializationTypeDefinitionTests
    {
        public MrwSerializationTypeDefinitionTests()
        {
            MockHelpers.LoadMockPlugin(createSerializationsCore: (inputType, typeProvider) =>
                inputType is InputModelType modelType ? [new MrwSerializationTypeDefinition(modelType, (typeProvider as ModelProvider)!)] : []);
        }

        internal static (ModelProvider Model, MrwSerializationTypeDefinition Serialization) CreateModelAndSerialization(InputModelType inputModel)
        {
            var model = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializations = model!.SerializationProviders;

            Assert.AreEqual(1, serializations.Count);
            Assert.IsInstanceOf<MrwSerializationTypeDefinition>(serializations[0]);

            return ((model as ModelProvider)!, (MrwSerializationTypeDefinition)serializations[0]);
        }

        [Test]
        public void TestBuildImplements()
        {
            // mock the model type provider
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);

            var interfaces = serialization.Implements;

            Assert.IsNotNull(interfaces);
            Assert.AreEqual(1, interfaces.Count);

            var expectedJsonModelTInterface = new CSharpType(typeof(IJsonModel<>), model.Type);

            Assert.That(interfaces.Any(i => i.Equals(expectedJsonModelTInterface)));
        }

        // This test validates the json model serialization write method is built correctly
        [Test]
        public void TestBuildJsonModelWriteCoreMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("JsonModelWriteCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected;
            if (model.Type.BaseType != null)
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
            var inputModel = InputFactory.Model("mockInputModel", modelAsStruct: true);
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildJsonModelWriteMethodObjectDeclaration();

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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildJsonModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IJsonModel<>), model.Type);
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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("JsonModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(model.Type, methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected;
            if (model.Type.BaseType != null)
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
            var inputModel = InputFactory.Model("mockInputModel", modelAsStruct: true);
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildJsonModelCreateMethodObjectDeclaration();

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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelWriteMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), model.Type);
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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelWriteCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            Assert.AreEqual(new CSharpType(typeof(BinaryData)), methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected;
            if (model.Type.BaseType != null)
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
            var inputModel = InputFactory.Model("mockInputModel", modelAsStruct: true);
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelWriteMethodObjectDeclaration();

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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), model.Type);
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(expectedJsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(model.Type, methodSignature?.ReturnType);

            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNull(methodBody);
            var bodyExpression = method?.BodyExpression as CastExpression;
            Assert.IsNotNull(bodyExpression);
            var invocationExpression = bodyExpression?.Inner as InvokeMethodExpression;
            Assert.IsNotNull(invocationExpression);
            Assert.AreEqual("PersistableModelCreateCore", invocationExpression?.MethodName);
            Assert.IsNotNull(invocationExpression?.InstanceReference);
            Assert.AreEqual(2, invocationExpression?.Arguments.Count);
        }

        // This test validates the persistable model serialization create core method is built correctly
        [Test]
        public void TestBuildPersistableModelCreateCoreMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);

            Assert.IsNotNull(serialization);

            var method = serialization.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.AreEqual(model.Type, methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");

            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }

        // This test validates the PersistableModel serialization Create method object declaration is built correctly
        [Test]
        public void BuildPersistableModelCreateMethodObjectDeclaration()
        {
            var inputModel = InputFactory.Model("mockInputModel", modelAsStruct: true);
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelCreateMethodObjectDeclaration();

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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelCreateMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), model.Type);
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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelGetFormatFromOptionsMethod();

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IPersistableModel<object>), model.Type);
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
            var inputModel = InputFactory.Model("mockInputModel", modelAsStruct: true);
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var method = serialization.BuildPersistableModelGetFormatFromOptionsObjectDeclaration();

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
        public void TestBuildFields()
        {
            var inputModel = InputFactory.Model("mockInputModel");
            var (_, serialization) = CreateModelAndSerialization(inputModel);
            var fields = serialization.Fields;

            Assert.IsNotNull(fields);
            Assert.AreEqual(0, fields.Count);
        }

        [Test]
        public void TestBuildConstructor_ValidateConstructors()
        {
            var properties = new List<InputModelProperty>
            {
                InputFactory.Property("requiredString", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("OptionalInt", InputPrimitiveType.Int32),
                InputFactory.Property("requiredCollection", InputFactory.Array(InputPrimitiveType.String), isRequired: true),
                InputFactory.Property("requiredDictionary", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: true),
             };

            var inputModel = InputFactory.Model("TestModel", properties: properties);

            var (_, serialization) = CreateModelAndSerialization(inputModel);
            var ctors = serialization.Constructors;
            Assert.IsNotNull(ctors);

            Assert.AreEqual(1, ctors.Count);

            var emptyCtor = ctors[0];
            Assert.AreEqual(MethodSignatureModifiers.Internal, emptyCtor.Signature.Modifiers);
            Assert.AreEqual(0, emptyCtor.Signature.Parameters.Count);
        }

        [Test]
        public void TestBuildDeserializationMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);

            var deserializationMethod = serialization.BuildDeserializationMethod();
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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var methods = serialization.Methods;

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
            var inputModel = InputFactory.Model("mockInputModel");
            var (model, serialization) = CreateModelAndSerialization(inputModel);
            var methods = serialization.Methods;

            Assert.IsTrue(methods.Count > 0);

            var method = methods.FirstOrDefault(m => m.Signature.Name == "MockInputModel");

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);

            var expectedModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Explicit | MethodSignatureModifiers.Operator;
            Assert.AreEqual(inputModel.Name.ToCleanName(), methodSignature?.Name);
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers);

            var methodParameters = methodSignature?.Parameters;
            Assert.AreEqual(1, methodParameters?.Count);
            var clientResultParameter = methodParameters?[0];
            Assert.AreEqual(new CSharpType(typeof(ClientResult)), clientResultParameter?.Type);
            Assert.IsNull(methodSignature?.ReturnType);

            var methodBody = method?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }
    }
}
