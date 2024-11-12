// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    internal class DiscriminatorTests
    {
        private static readonly InputModelType _catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("willScratchOwner", InputPrimitiveType.Boolean, isRequired: true, isDiscriminator: true)
        ]);
        private static readonly InputModelType _dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("likesBones", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _baseModel = InputFactory.Model(
            "pet",
            properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
            ],
            discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", _catModel }, { "dog", _dogModel } });

        [Test]
        public void UnknownVariantIJsonModelTShouldBeBase()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel, _dogModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            var serialization = unknownModel!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            var jsonInterface = serialization!.Implements.FirstOrDefault(i => i.Name == "IJsonModel");
            Assert.IsNotNull(jsonInterface);
            Assert.AreEqual(1, jsonInterface!.Arguments.Count);
            Assert.AreEqual("Pet", jsonInterface!.Arguments[0].Name);
        }

        [Test]
        public void BaseSerializationContainsSwitchStatement()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = ClientModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            var serialization = baseModel!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            var deserializeMethod = serialization!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializePet");
            Assert.IsNotNull(deserializeMethod);
            var statements = deserializeMethod!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.AreEqual(3, statements!.Statements.Count);
            var ifStatement = statements.Statements[1] as IfStatement;
            Assert.IsNotNull(ifStatement);
            var ifBodyStatements = ifStatement!.Body as MethodBodyStatements;
            Assert.IsNotNull(ifBodyStatements);
            Assert.AreEqual(1, ifBodyStatements!.Statements.Count);
            var switchStatement = ifBodyStatements!.Statements[0] as SwitchStatement;
            Assert.IsNotNull(switchStatement);
            Assert.AreEqual(2, switchStatement!.Cases.Count);
        }

        [Test]
        public void UnknownVariantJsonCreateCoreShouldReturnDeserializeBase()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel, _dogModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            var serialization = unknownModel!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            var jsonCreateCoreMethod = serialization!.Methods.FirstOrDefault(m => m.Signature.Name == "JsonModelCreateCore");
            Assert.IsNotNull(jsonCreateCoreMethod);
            var statements = jsonCreateCoreMethod!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.IsTrue(statements!.Statements.Last().ToDisplayString().Contains("DeserializePet"));
        }

        [Test]
        public void UnknownVariantPersistableCreateCoreShouldReturnDeserializeBase()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel, _dogModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            var serialization = unknownModel!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            var persistableCreateCoreMethod = serialization!.Methods.FirstOrDefault(m => m.Signature.Name == "PersistableModelCreateCore");
            Assert.IsNotNull(persistableCreateCoreMethod);
            var statements = persistableCreateCoreMethod!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.IsTrue(statements!.Statements.Last().ToDisplayString().Contains("DeserializePet"));
        }

        [Test]
        public void BaseShouldHaveProxyAttribute()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = ClientModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            var serialization = baseModel!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            var proxyAttribute = serialization!.Attributes.FirstOrDefault(a => a.Type.Equals(typeof(PersistableModelProxyAttribute)));
            Assert.IsNotNull(proxyAttribute);
        }

        [Test]
        public void DerivedShouldNotHaveProxyAttribute()
        {
            MockHelpers.LoadMockPlugin();
            var catModel = ClientModelPlugin.Instance.TypeFactory.CreateModel(_catModel);
            Assert.IsNotNull(catModel);
            var serialization = catModel!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            var proxyAttribute = serialization!.Attributes.FirstOrDefault(a => a.Type.Equals(typeof(PersistableModelProxyAttribute)));
            Assert.IsNull(proxyAttribute);
        }

        [Test]
        public void UnknownVariantDeserializeShouldUseBaseProperties()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel, _dogModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            var serialization = unknownModel!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            var deserializeMethod = serialization!.Methods.FirstOrDefault(m => m.Signature.Name == "DeserializeUnknownPet");
            foreach(var property in _baseModel.Properties)
            {
                Assert.IsNotNull(
                    deserializeMethod!.BodyStatements!.ToDisplayString().Contains($"if (property.NameEquals(\"{property.Name}\"u8))"),
                    $"Expected DeserializeUnknownPet to contain a property lookup statement for {property.Name}");
            }
        }

        [Test]
        public void UnknownVariantShouldPassKindToBase()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel, _dogModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            Assert.IsNotNull(unknownModel!.FullConstructor.Signature.Initializer);
            Assert.IsTrue(unknownModel.FullConstructor.Signature.Initializer!.Arguments.Any(a => a.ToDisplayString() == ("(kind ?? \"unknown\")")));
        }

        [Test]
        public void DerivedShouldPassLiteralForKindToBase()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel, _dogModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var catModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModel);
            var publicCtor = catModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);

            var initializer = publicCtor!.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsFalse(initializer!.Arguments.Any(a => a.ToDisplayString().Contains("kind")));
            Assert.IsTrue(initializer!.Arguments.Any(a => a.ToDisplayString() == "\"cat\""));
        }

        // This test validates that the correct discriminator property name is used when deserializing
        [Test]
        public void DiscriminatorDeserializationUsesCorrectDiscriminatorPropName()
        {
            var treeModel = InputFactory.Model(
                "tree",
                discriminatedKind: "tree",
                properties:
                []);
            var baseModel = InputFactory.Model(
                "plant",
                properties:
                [
                    InputFactory.Property("foo", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "tree", treeModel } });

            MockHelpers.LoadMockPlugin(inputModels: () => [baseModel, treeModel]);
            var baseModelProvider = ClientModelPlugin.Instance.OutputLibrary.TypeProviders.OfType<ModelProvider>()
                .FirstOrDefault(t => t.Name == "Plant");
            Assert.IsNotNull(baseModelProvider);

            var deserializationMethod = baseModelProvider!.SerializationProviders.FirstOrDefault()!.Methods
                .FirstOrDefault(m => m.Signature.Name == "DeserializePlant");
            Assert.IsTrue(deserializationMethod?.BodyStatements!.ToDisplayString().Contains(
                $"if (element.TryGetProperty(\"foo\"u8, out global::System.Text.Json.JsonElement discriminator))"));
        }

        [Test]
        public void TestBuildJsonModelCreateMethodProperlyCastsForDiscriminatedType()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var model = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(model);

            var serialization = model!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(serialization);
            var method = serialization!.Methods.FirstOrDefault(m => m.Signature.Name == "Create" && m.Signature.ExplicitInterface?.Name == "IJsonModel");

            Assert.IsNotNull(method);

            var expectedJsonInterface = new CSharpType(typeof(IJsonModel<>), model!.Type);
            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);

            var expectedReturnType = expectedJsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);

            var invocationExpression = method!.BodyExpression;
            Assert.IsNotNull(invocationExpression);
            Assert.AreEqual(
                "((global::Sample.Models.Cat)this.JsonModelCreateCore(ref reader, options))",
                invocationExpression!.ToDisplayString());
        }

        [Test]
        public void TestBuildJsonModelCreateMethodProperlyDoesNotCastForUnknown()
        {
            MockHelpers.LoadMockPlugin(inputModels: () => [_baseModel, _catModel]);
            var outputLibrary = ClientModelPlugin.Instance.OutputLibrary;
            var model = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(model);

            var serialization = model!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(serialization);
            var method = serialization!.Methods.FirstOrDefault(m => m.Signature.Name == "Create" && m.Signature.ExplicitInterface?.Name == "IJsonModel");

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Pet", methodSignature?.ReturnType!.Name);

            var invocationExpression = method!.BodyExpression;
            Assert.IsNotNull(invocationExpression);
            Assert.AreEqual(
                "this.JsonModelCreateCore(ref reader, options)",
                invocationExpression!.ToDisplayString());
        }

        // This test validates that a discriminated sub-type with its own discriminator property
        // properly generates the deserialization method to deserialize into its' discriminated sub-types
        [Test]
        public void TestNestedDiscriminatedModelWithOwnDiscriminator()
        {
            var oakTreeModel = InputFactory.Model(
                "oakTree",
                discriminatedKind: "oak",
                properties:
                [
                    InputFactory.Property("treeType", InputPrimitiveType.String, isRequired: true),
                ]);
            var treeModel = InputFactory.Model(
                "tree",
                discriminatedKind: "tree",
                properties:
                [
                    InputFactory.Property("treeType", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "oak", oakTreeModel } });
            var baseModel = InputFactory.Model(
                "plant",
                properties:
                [
                    InputFactory.Property("plantType", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "tree", treeModel } });

            MockHelpers.LoadMockPlugin(inputModels: () => [baseModel, treeModel, oakTreeModel]);
            var baseModelProvider = ClientModelPlugin.Instance.OutputLibrary.TypeProviders.OfType<ModelProvider>()
                .FirstOrDefault(t => t.Name == "Plant");
            var treeModelProvider = ClientModelPlugin.Instance.OutputLibrary.TypeProviders.OfType<ModelProvider>()
                .FirstOrDefault(t => t.Name == "Tree");
            var oakTreeModelProvider = ClientModelPlugin.Instance.OutputLibrary.TypeProviders.OfType<ModelProvider>()
                .FirstOrDefault(t => t.Name == "OakTree");
            Assert.IsNotNull(baseModelProvider);
            Assert.IsNotNull(treeModelProvider);
            Assert.IsNotNull(oakTreeModelProvider);

            var baseModelConstructor = baseModelProvider!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsNotNull(baseModelConstructor);
            Assert.IsTrue(baseModelConstructor!.Signature.Parameters.Any(p => p.Name == "name"));
            Assert.IsTrue(baseModelConstructor.Signature.Parameters.Any(p => p.Name == "plantType"));

            var treeModelConstructor = treeModelProvider!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(treeModelConstructor);
            Assert.IsTrue(treeModelConstructor!.Signature.Parameters.Any(p => p.Name == "name"));
            Assert.IsFalse(treeModelConstructor.Signature.Parameters.Any(p => p.Name == "plantType"));

            var oakTreeModelConstructor = oakTreeModelProvider!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(oakTreeModelConstructor);
            Assert.IsTrue(oakTreeModelConstructor!.Signature.Parameters.Any(p => p.Name == "name"));
            Assert.IsFalse(oakTreeModelConstructor.Signature.Parameters.Any(p => p.Name == "plantType"));

            // validate the base discriminator deserialization method has the switch statement
            var baseDeserializationMethod = baseModelProvider!.SerializationProviders.FirstOrDefault()!.Methods
                .FirstOrDefault(m => m.Signature.Name == "DeserializePlant");
            Assert.IsTrue(baseDeserializationMethod?.BodyStatements!.ToDisplayString().Contains(
                $"if (element.TryGetProperty(\"plantType\"u8, out global::System.Text.Json.JsonElement discriminator))"));

            var treeModelSerializationProvider = treeModelProvider!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(treeModelSerializationProvider);

            // validate the deserialization methods for the tree model
            var writer = new TypeProviderWriter(treeModelSerializationProvider!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
