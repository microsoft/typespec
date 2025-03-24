// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelProviders
{
    public class DiscriminatorTests
    {
        private static readonly InputModelType _dinosaurModel = InputFactory.Model("dinosaur", discriminatedKind: "dinosaur", properties:
        [
            InputFactory.Property("type", InputPrimitiveType.String, isRequired: true),
            InputFactory.Property("dinosaurKind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)
        ]);

        private static readonly InputModelType _animalModel = InputFactory.Model(
            "animal",
            properties:
            [
                InputFactory.Property("type", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("name", InputPrimitiveType.Boolean, isRequired: true)
            ],
            discriminatedModels: new Dictionary<string, InputModelType>()
            {
                { "dinosaur", _dinosaurModel }
            });

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


        private static IEnumerable<TestCaseData> GetBaseModels()
        {
            yield return new TestCaseData(_baseModel, """
                                                      /// <summary>
                                                      /// pet description
                                                      /// Please note this is the abstract base class. The derived classes available for instantiation are: <see cref="Cat"/>, <see cref="Dog"/>, and <see cref="AnotherAnimal"/>.
                                                      /// </summary>

                                                      """);
            yield return new TestCaseData(_baseEnumModel, """
                                                          /// <summary>
                                                          /// pet description
                                                          /// Please note this is the abstract base class. The derived classes available for instantiation are: <see cref="Cat"/> and <see cref="Dog"/>.
                                                          /// </summary>

                                                          """);
            yield return new TestCaseData(_animalModel, """
                                                        /// <summary>
                                                        /// animal description
                                                        /// Please note this is the abstract base class. The derived classes available for instantiation are: <see cref="Dinosaur"/>.
                                                        /// </summary>

                                                        """);
        }

        [TestCaseSource(nameof(GetBaseModels))]
        public void BaseShouldBeAbstract(InputModelType inputModel, string expectedSummary)
        {
            MockHelpers.LoadMockGenerator();
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
            Assert.IsNotNull(baseModel);
            Assert.IsTrue(baseModel!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));

            // Base model description should reference derived models
            Assert.IsNotNull(baseModel.XmlDocs.Summary);
            Assert.AreEqual(expectedSummary, baseModel.XmlDocs.Summary!.ToDisplayString());
        }

        [Test]
        public void DiscriminatorPropertyShouldBeInternal()
        {
            MockHelpers.LoadMockGenerator();
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            var discriminator = baseModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNotNull(discriminator);
            Assert.IsTrue(discriminator!.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
        }

        [Test]
        public void BaseConstructorShouldBePrivateProtected()
        {
            MockHelpers.LoadMockGenerator();
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(_baseModel);
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
            MockHelpers.LoadMockGenerator();
            var catModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(_catModel);
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
            MockHelpers.LoadMockGenerator();
            var dogModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(_dogModel);
            Assert.IsNotNull(dogModel);
            Assert.AreEqual(2, dogModel!.Constructors.Count);
            var publicCtor = dogModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);
            Assert.IsFalse(publicCtor!.Signature.Parameters.Any(p => p.Name == "kind"));
        }

        [Test]
        public void DerivedCtorHasAdditionalBinaryDataPropertiesParam()
        {
            MockHelpers.LoadMockGenerator();
            var catModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(_catModel);
            Assert.IsNotNull(catModel);
            Assert.AreEqual(2, catModel!.Constructors.Count);
            var serializationCtor = catModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.IsTrue(serializationCtor!.Signature.Parameters.Any(p => p.Name == "additionalBinaryDataProperties"));
        }

        [Test]
        public void CreateUnknownVariant()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var models = outputLibrary.TypeProviders.OfType<ModelProvider>();
            Assert.AreEqual(6, models.Count());
            // since each model has a discriminator, there should be 3 additional models for their unknown variants
            var unknownPet = models.FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownPet);
            var unknownCat = models.FirstOrDefault(t => t.Name == "UnknownCat");
            Assert.IsNotNull(unknownCat);
            var unknownDog = models.FirstOrDefault(t => t.Name == "UnknownDog");
            Assert.IsNotNull(unknownDog);
        }

        // This test validates that a nested discriminated model with its' own discriminator property will have an unknown variant
        [Test]
        public void DiscriminatedModelWithNoSubTypesHasUnknownVariant()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_animalModel, _dinosaurModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var models = outputLibrary.TypeProviders.OfType<ModelProvider>();
            Assert.AreEqual(4, models.Count());

            var animalModel = models.FirstOrDefault(t => t.Name == "Animal");
            Assert.IsNotNull(animalModel);
            Assert.IsNull(animalModel!.BaseModelProvider);
            var unknownAnimal = models.FirstOrDefault(t => t.Name == "UnknownAnimal");
            Assert.IsNotNull(unknownAnimal);
            Assert.AreEqual(animalModel, unknownAnimal!.BaseModelProvider);

            var dinosaurModel = models.FirstOrDefault(t => t.Name == "Dinosaur");
            Assert.IsNotNull(dinosaurModel);
            Assert.AreEqual(animalModel, dinosaurModel!.BaseModelProvider);
            var unknownDinosaur = models.FirstOrDefault(t => t.Name == "UnknownDinosaur");
            Assert.IsNotNull(unknownDinosaur);
            Assert.AreEqual(dinosaurModel, unknownDinosaur!.BaseModelProvider);
        }

        [Test]
        public void UnknownVariantIsInternal()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            Assert.IsTrue(unknownModel!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void UnknownVariantHasPetBase()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            Assert.AreEqual("Pet", unknownModel!.Type.BaseType!.Name);
        }

        // This test validates that a discriminator model whose discriminator value is "unknown" will throw
        [Test]
        public void DiscriminatedModelWithUnknownValueThrows()
        {
            Assert.Throws<ArgumentException>(() =>
            {
                var unknownPlantModel = InputFactory.Model(
                    "unknownPlant", discriminatedKind: "unknown", properties:
                    [
                        InputFactory.Property("type", InputPrimitiveType.String, isRequired: true),
                    ]);

                var plantModel = InputFactory.Model(
                    "plant",
                    properties:
                    [
                        InputFactory.Property("type", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                        InputFactory.Property("name", InputPrimitiveType.Boolean, isRequired: true)
                    ],
                    discriminatedModels: new Dictionary<string, InputModelType>()
                    {
                        { "unknown", unknownPlantModel }
                    });
            });
        }

        [Test]
        public void SerializationCtorForUnknownTakesDiscriminator()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            var serializationCtor = unknownModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.AreEqual("kind", serializationCtor!.Signature.Parameters[0].Name);
        }

        [Test]
        public void BaseDoesNotHaveDiscriminatorField()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var baseModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);
            Assert.IsFalse(baseModel!.Fields.Any(f => f.Name == "_kind"));
        }

        [Test]
        public void BaseKindPropertyIsNotVirtual()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var baseModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);
            var kindProperty = baseModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNotNull(kindProperty);
            Assert.IsFalse(kindProperty!.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        [Test]
        public void DerivedHasNoKindProperty()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
            var catModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModel);
            var kindProperty = catModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNull(kindProperty);
        }

        [Test]
        public void ModelWithNestedDiscriminators()
        {
            MockHelpers.LoadMockGenerator(inputModelTypes: [_baseEnumModel, _dogEnumModel, _anotherAnimal]);
            var outputLibrary = CodeModelGenerator.Instance.OutputLibrary;
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [_baseModel, _catModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var baseModel = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);

            var primaryBaseModelCtor = baseModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsNotNull(primaryBaseModelCtor);
            Assert.AreEqual(1, primaryBaseModelCtor!.Signature.Parameters.Count);
            Assert.AreEqual("kind", primaryBaseModelCtor.Signature.Parameters[0].Name);
            Assert.AreEqual("CustomKind", primaryBaseModelCtor.Signature.Parameters[0].Type.Name);

            var catModel = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [_baseModel, _catModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var baseModel = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);

            var primaryBaseModelCtor = baseModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsNotNull(primaryBaseModelCtor);
            Assert.AreEqual(1, primaryBaseModelCtor!.Signature.Parameters.Count);
            Assert.AreEqual("kind", primaryBaseModelCtor.Signature.Parameters[0].Name);
            Assert.AreEqual("CustomKind", primaryBaseModelCtor.Signature.Parameters[0].Type.Name);

            var catModel = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [_baseModel, _catModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var baseModel = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);

            var baseModelPrimaryCtor = baseModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsNotNull(baseModelPrimaryCtor);
            Assert.AreEqual(1, baseModelPrimaryCtor!.Signature.Parameters.Count);

            // the custom property should be marked as the discriminator
            Assert.AreEqual("customName", baseModelPrimaryCtor.Signature.Parameters[0].Name);
            Assert.IsTrue(baseModelPrimaryCtor.Signature.Parameters[0].Property?.IsDiscriminator);

            var catModel = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
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
