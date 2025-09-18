// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ScmModelProvider
{
    public class ScmModelProviderTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestSimpleDynamicModel()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestSingleDiscriminatorDynamicModel(bool validateBase)
        {
            InputModelType catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { {"cat", catModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel]);
            var outputLibrary = ScmCodeModelGenerator.Instance.OutputLibrary;

            var baseModelProvider = outputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>()
                .FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModelProvider);

            var catModelProvider = outputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>()
                .FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModelProvider);
            var model = validateBase
                ? baseModelProvider
                : catModelProvider;

            Assert.IsNotNull(model);

            var expectedDynamicModel = validateBase;
            Assert.AreEqual(expectedDynamicModel, model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            var caseName = TestContext.CurrentContext.Test.Properties.Get("caseName");
            Assert.AreEqual(Helpers.GetExpectedFromFile($"{caseName}{validateBase}"), file.Content);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestNestedDiscriminatorDynamicModel(bool discriminatedTypeIsDynamicModel)
        {
            InputModelType tigerModel = InputFactory.Model(
                "tiger",
                discriminatedKind: "tiger",
                isDynamicModel: discriminatedTypeIsDynamicModel,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ]);
            InputModelType catModel = InputFactory.Model(
                "cat",
                discriminatedKind: "cat",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "tiger", tigerModel } });
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel, tigerModel]);
            var outputLibrary = ScmCodeModelGenerator.Instance.OutputLibrary;

            var model = outputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>()
                .FirstOrDefault(t => t.Name == "Tiger");
            Assert.IsNotNull(model);
            Assert.AreEqual(discriminatedTypeIsDynamicModel, model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            var caseName = TestContext.CurrentContext.Test.Properties.Get("caseName");
            Assert.AreEqual(Helpers.GetExpectedFromFile($"{caseName}{discriminatedTypeIsDynamicModel}"), file.Content);
        }

        [Test]
        public void TestDynamicModelWithBinaryDataAdditionalProps()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                additionalProperties: InputPrimitiveType.Any,
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDynamicModelWithUnionAdditionalProps()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                additionalProperties: new InputUnionType("union", [InputPrimitiveType.String, InputPrimitiveType.Float64]),
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDynamicModelWithPropagators()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("p1",
                        InputFactory.Model(
                            "anotherDynamic",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDiscriminatedDynamicBaseModel()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("barks", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel }, { "dog", dogModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dogModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(baseModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDiscriminatedDynamicDerivedModel()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("barks", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel }, { "dog", dogModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dogModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.HasDynamicModelSupport);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDynamicDerivedModel()
        {
            var catModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                derivedModels: [catModel]);

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.HasDynamicModelSupport);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
