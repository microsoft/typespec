// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
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
    }
}
