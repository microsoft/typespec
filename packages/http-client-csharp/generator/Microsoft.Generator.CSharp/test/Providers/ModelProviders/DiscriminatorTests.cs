// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelProviders
{
    public class DiscriminatorTests
    {
        private static readonly InputModelType _catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("willScratchOwner", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("likesBones", InputPrimitiveType.Boolean, isRequired: true)
        ]);

        private static readonly InputModelType _anotherAnimal = InputFactory.Model("anotherAnimal", discriminatedKind: "dog", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("other", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)
        ]);
        private static readonly InputModelType _baseModel = InputFactory.Model(
            "pet",
            properties: [InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)],
            discriminatedModels: new Dictionary<string, InputModelType>()
            {
                { "cat", _catModel },
                { "dog", _dogModel },
                { "otherAnimal", _anotherAnimal }
            });

        private static readonly InputEnumType _petEnum = InputFactory.Enum("pet", InputPrimitiveType.String, isExtensible: true, values:
        [
            InputFactory.EnumMember.String("cat", "cat"),
            InputFactory.EnumMember.String("dog", "dog")
        ]);
        private static readonly InputModelType _catEnumModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
        [
            InputFactory.Property("kind", _petEnum, isRequired: true, isDiscriminator: true),
            InputFactory.Property("willScratchOwner", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _dogEnumModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
        [
            InputFactory.Property("kind", _petEnum, isRequired: true, isDiscriminator: true),
            InputFactory.Property("likesBones", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _baseEnumModel = InputFactory.Model(
            "pet",
            properties: [InputFactory.Property("kind", _petEnum, isRequired: true, isDiscriminator: true)],
            discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", _catEnumModel }, { "dog", _dogEnumModel } });

        [Test]
        public void BaseShouldBeAbstract()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            Assert.IsTrue(baseModel!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
        }

        [Test]
        public void DiscriminatorPropertyShouldBeInternal()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            var discriminator = baseModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNotNull(discriminator);
            Assert.IsTrue(discriminator!.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
        }

        [Test]
        public void BaseConstructorShouldBePrivateProtected()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            Assert.AreEqual(2, baseModel!.Constructors.Count);
            var ctor1 = baseModel.Constructors[0];
            var ctor2 = baseModel.Constructors[1];
            var initCtor = ctor1.Signature.Parameters.Count < ctor2.Signature.Parameters.Count ? ctor1 : ctor2;
            var serializationCtor = ctor1.Signature.Parameters.Count < ctor2.Signature.Parameters.Count ? ctor2 : ctor1;
            Assert.IsNotNull(initCtor);
            Assert.IsTrue(initCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsTrue(initCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Private));
            Assert.IsNotNull(serializationCtor);
            Assert.IsTrue(serializationCtor!.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
        }

        [Test]
        public void DerivedPublicCtorShouldSetDiscriminator()
        {
            MockHelpers.LoadMockPlugin();
            var catModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_catModel);
            Assert.IsNotNull(catModel);
            Assert.AreEqual(2, catModel!.Constructors.Count);
            var publicCtor = catModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);

            var init = publicCtor!.Signature.Initializer;
            Assert.IsNotNull(init);
            var expression = init!.Arguments[0] as ScopedApi;
            Assert.IsNotNull(expression);
            var original = expression!.Original as LiteralExpression;
            Assert.IsNotNull(original);
            Assert.AreEqual("cat", original!.Literal);
        }

        [Test]
        public void DerivedPublicCtorShouldNotHaveKindParam()
        {
            MockHelpers.LoadMockPlugin();
            var dogModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_dogModel);
            Assert.IsNotNull(dogModel);
            Assert.AreEqual(2, dogModel!.Constructors.Count);
            var publicCtor = dogModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);
            Assert.IsFalse(publicCtor!.Signature.Parameters.Any(p => p.Name == "kind"));
        }

        [Test]
        public void DerviedCtorHasSardAsLastParam()
        {
            MockHelpers.LoadMockPlugin();
            var catModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_catModel);
            Assert.IsNotNull(catModel);
            Assert.AreEqual(2, catModel!.Constructors.Count);
            var serializationCtor = catModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.AreEqual("additionalBinaryDataProperties", serializationCtor!.Signature.Parameters.Last().Name);
        }

        [Test]
        public void CreateUnknownVariant()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var models = outputLibrary.TypeProviders.OfType<ModelProvider>();
            Assert.AreEqual(4, models.Count());
            var unknownModel = models.FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
        }

        [Test]
        public void UnknownVariantIsInternal()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            Assert.IsTrue(unknownModel!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void UnknownVariantHasPetBase()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            Assert.AreEqual("Pet", unknownModel!.Type.BaseType!.Name);
        }

        [Test]
        public void SerializationCtorForUnknownTakesDiscriminator()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            var serializationCtor = unknownModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.AreEqual("kind", serializationCtor!.Signature.Parameters[0].Name);
        }

        [Test]
        public void BaseDoesNotHaveDiscriminatorField()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var baseModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);
            Assert.IsFalse(baseModel!.Fields.Any(f => f.Name == "_kind"));
        }

        [Test]
        public void BaseKindPropertyIsNotVirtual()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var baseModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);
            var kindProperty = baseModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNotNull(kindProperty);
            Assert.IsFalse(kindProperty!.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        [Test]
        public void DerivedHasNoKindProperty()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var catModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModel);
            var kindProperty = catModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNull(kindProperty);
        }

        [Test]
        public void ModelWithNestedDiscriminators()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseEnumModel, _dogEnumModel, _anotherAnimal]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var anotherDogModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "AnotherAnimal");
            Assert.IsNotNull(anotherDogModel);

            var serializationCtor = anotherDogModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.AreEqual(3, serializationCtor!.Signature.Parameters.Count);

            // ensure both discriminators are present
            var kindParam = serializationCtor!.Signature.Parameters.FirstOrDefault(p => p.Name == "kind");
            Assert.IsNotNull(kindParam);
            var otherParam = serializationCtor!.Signature.Parameters.FirstOrDefault(p => p.Name == "other");
            Assert.IsNotNull(otherParam);

            // the primary ctor should only have the model's own discriminator
            var publicCtor = anotherDogModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);
            Assert.AreEqual(1, publicCtor!.Signature.Parameters.Count);
            Assert.AreEqual("other", publicCtor.Signature.Parameters[0].Name);
        }

        [Test]
        public async Task ModelWithCustomFixedEnumDiscriminator()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [_baseModel, _catModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var baseModel = plugin.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);

            var primaryBaseModelCtor = baseModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsNotNull(primaryBaseModelCtor);
            Assert.AreEqual(1, primaryBaseModelCtor!.Signature.Parameters.Count);
            Assert.AreEqual("kind", primaryBaseModelCtor.Signature.Parameters[0].Name);
            Assert.AreEqual("CustomKind", primaryBaseModelCtor.Signature.Parameters[0].Type.Name);

            var catModel = plugin.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModel);

            var catSerializationCtor = catModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(catSerializationCtor);
            Assert.AreEqual(3, catSerializationCtor!.Signature.Parameters.Count);

            // ensure discriminator is present and is the custom type
            var kindParam = catSerializationCtor!.Signature.Parameters.FirstOrDefault(p => p.Name == "kind");
            Assert.IsNotNull(kindParam);
            Assert.AreEqual("CustomKind", kindParam!.Type.Name);

            // the primary ctor should call the base ctor using the custom discriminator
            var publicCtor = catModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);
            Assert.IsTrue(publicCtor!.Signature.Parameters.Any(p => p.Name != "kind"));

            var init = publicCtor!.Signature.Initializer;
            Assert.AreEqual(1, init!.Arguments.Count);
            Assert.IsTrue(init.Arguments[0].ToDisplayString().Contains("CustomKind.Cat"));
        }

        [Test]
        public async Task ModelWithCustomExtensibleEnumDiscriminator()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [_baseModel, _catModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var baseModel = plugin.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);

            var primaryBaseModelCtor = baseModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsNotNull(primaryBaseModelCtor);
            Assert.AreEqual(1, primaryBaseModelCtor!.Signature.Parameters.Count);
            Assert.AreEqual("kind", primaryBaseModelCtor.Signature.Parameters[0].Name);
            Assert.AreEqual("CustomKind", primaryBaseModelCtor.Signature.Parameters[0].Type.Name);

            var catModel = plugin.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModel);

            var catSerializationCtor = catModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(catSerializationCtor);
            Assert.AreEqual(3, catSerializationCtor!.Signature.Parameters.Count);

            var kindParam = catSerializationCtor!.Signature.Parameters.FirstOrDefault(p => p.Name == "kind");
            Assert.IsNotNull(kindParam);
            Assert.AreEqual("CustomKind", kindParam!.Type.Name);

            // the primary ctor should call the base ctor using the custom discriminator literal value, as there
            // is an implicit conversion from string to CustomKind
            var publicCtor = catModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);
            Assert.IsTrue(publicCtor!.Signature.Parameters.Any(p => p.Name != "kind"));


            var init = publicCtor!.Signature.Initializer;
            Assert.AreEqual(1, init!.Arguments.Count);
            Assert.AreEqual("\"cat\"", init.Arguments[0].ToDisplayString());
        }

        [Test]
        public async Task CanCustomizeDiscriminator()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [_baseModel, _catModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var baseModel = plugin.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);

            var baseModelPrimaryCtor = baseModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsNotNull(baseModelPrimaryCtor);
            Assert.AreEqual(1, baseModelPrimaryCtor!.Signature.Parameters.Count);

            // the custom property should be marked as the discriminator
            Assert.AreEqual("customName", baseModelPrimaryCtor.Signature.Parameters[0].Name);
            Assert.IsTrue(baseModelPrimaryCtor.Signature.Parameters[0].Property?.IsDiscriminator);

            var catModel = plugin.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModel);

            var catSerializationCtor = catModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(catSerializationCtor);
            Assert.AreEqual(3, catSerializationCtor!.Signature.Parameters.Count);

            var discriminatorParam = catSerializationCtor!.Signature.Parameters.FirstOrDefault(p => p.Name == "customName");
            Assert.IsNotNull(discriminatorParam);
            Assert.IsTrue(discriminatorParam!.Property?.IsDiscriminator);
        }
    }
}
