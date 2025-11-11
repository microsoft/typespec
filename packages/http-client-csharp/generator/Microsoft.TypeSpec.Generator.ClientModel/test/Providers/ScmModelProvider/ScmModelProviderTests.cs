// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using ScmModel = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;

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
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

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

            var baseModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModelProvider);

            var catModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModelProvider);
            var model = validateBase
                ? baseModelProvider
                : catModelProvider;

            Assert.IsNotNull(model);

            var expectedDynamicModel = validateBase;
            Assert.AreEqual(expectedDynamicModel, model!.IsDynamicModel);
            
            if (expectedDynamicModel)
            {
                AssertJsonIgnoreAttributeOnPatchProperty(model);
            }

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

            var model = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Tiger");
            Assert.IsNotNull(model);
            Assert.AreEqual(discriminatedTypeIsDynamicModel, model!.IsDynamicModel);
            
            if (discriminatedTypeIsDynamicModel)
            {
                AssertJsonIgnoreAttributeOnPatchProperty(model);
            }

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
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

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
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

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
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

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
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(baseModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

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
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

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
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestStructDynamicModel()
        {
            var catModel = InputFactory.Model("cat", isDynamicModel: true, modelAsStruct: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task TestCustomStructDynamicModel()
        {
            var catModel = InputFactory.Model("cat", isDynamicModel: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task TestDynamicModelWithCustomFullConstructor()
        {
            var catModel = InputFactory.Model("cat", isDynamicModel: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var customCtor = model.CustomCodeView?.Constructors.FirstOrDefault(c => c.Signature.Parameters.Count > 0);
            Assert.IsNotNull(customCtor);

            var patchParam = customCtor!.Signature.Parameters.FirstOrDefault(p => p.Name == "patch");
            Assert.IsNotNull(patchParam);
            Assert.IsTrue(patchParam!.IsIn);
        }

        private void AssertJsonIgnoreAttributeOnPatchProperty(ScmModel model)
        {
            var patchProperty = model.JsonPatchProperty;
            
            // JsonPatch property may be null if:
            // 1. The model only has additional properties without full dynamic model support
            // 2. The model inherits the property from a base class
            if (patchProperty == null)
            {
                return;
            }
            
            var jsonIgnoreAttribute = patchProperty.Attributes.FirstOrDefault(a => a.Type.Equals(typeof(JsonIgnoreAttribute)));
            Assert.IsNotNull(jsonIgnoreAttribute, "JsonPatch property should have JsonIgnore attribute");
        }
    }
}
