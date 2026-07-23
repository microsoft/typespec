// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
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
            ],
                isDynamicModel: true);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel } });

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

            Assert.IsTrue(model!.IsDynamicModel);

            AssertJsonIgnoreAttributeOnPatchProperty(model);

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
            // Dynamic models with Record<unknown> (BinaryData additional properties) should generate
            // JsonPatch instead of AdditionalProperties.
            Assert.IsNotNull(model.JsonPatchProperty, "Dynamic models with Record<unknown> should generate JsonPatch");
            Assert.IsFalse(model.Properties.Any(p => p.IsAdditionalProperties),
                "Dynamic models with Record<unknown> should not generate AdditionalProperties");
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task TestDynamicModelWithBinaryDataAdditionalPropsBackCompat()
        {
            // Scenario: A model was previously shipped with AdditionalProperties (IDictionary<string, BinaryData>)
            // but the model has now been updated to use @dynamicModel. Both JsonPatch and AdditionalProperties
            // should be generated to maintain backward compatibility.
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                additionalProperties: InputPrimitiveType.Any,
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            // Backcompat: both JsonPatch and AdditionalProperties should be generated
            Assert.IsNotNull(model.JsonPatchProperty, "Dynamic model should generate JsonPatch");
            Assert.IsTrue(model.Properties.Any(p => p.IsAdditionalProperties),
                "Dynamic model should still generate AdditionalProperties for backcompat");
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
            ], isDynamicModel: true);
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

        [Test]
        public void TestDynamicModelInheritsFromNonDiscriminatedBase()
        {
            var baseModel = InputFactory.Model(
                "animal",
                isDynamicModel: false,
                properties:
                [
                    InputFactory.Property("species", InputPrimitiveType.String, isRequired: true)
                ]);

            var dynamicDerivedModel = InputFactory.Model(
                "dog",
                isDynamicModel: true,
                baseModel: baseModel,
                properties:
                [
                    InputFactory.Property("barks", InputPrimitiveType.Boolean, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dynamicDerivedModel]);
            var outputLibrary = ScmCodeModelGenerator.Instance.OutputLibrary;

            // Verify that the base model is NOT marked as dynamic
            var baseModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Animal");
            Assert.IsNotNull(baseModelProvider);
            Assert.IsFalse(baseModelProvider!.IsDynamicModel, "Non-discriminated base model should NOT be marked as dynamic");

            // Verify that the derived model IS marked as dynamic
            var derivedModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Dog");
            Assert.IsNotNull(derivedModelProvider);
            Assert.IsTrue(derivedModelProvider!.IsDynamicModel, "Derived model should be marked as dynamic");

            AssertJsonIgnoreAttributeOnPatchProperty(derivedModelProvider);

            var writer = new TypeProviderWriter(derivedModelProvider);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
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

        [Test]
        public void TestMultipartFormDataModel_SingleRequiredFile()
        {
            var inputModel = MultipartModel(
                "MultiPartRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_MultiFileOnly()
        {
            var inputModel = MultipartModel(
                "BinaryArrayPartsRequest",
                [MultiFilePartProperty("pictures")]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_OptionalFile()
        {
            var inputModel = MultipartModel(
                "OptionalFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("optionalFile", isRequired: false),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_MultipleFiles()
        {
            var inputModel = MultipartModel(
                "DualFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("primaryFile"),
                    FilePartProperty("secondaryFile", isRequired: false),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_WithRequiredFilename_EmitsAugmentedOverloads()
        {
            // Required filename triggers the string/Stream/BinaryData augmented overloads.
            var filename = InputFactory.Property("filename", InputPrimitiveType.String, isRequired: true);
            var inputModel = MultipartModel(
                "FileNamedRequest",
                [FilePartProperty("file", filename: filename)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_MixedJsonAndMultipartUsage()
        {
            var inputModel = MultipartModel(
                "MixedUsageRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestModelWithOptionalFile_DoesNotGenerateDuplicateConstructors()
        {
            var inputModel = MultipartModel(
                "MixedOptionalFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage", isRequired: false),
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;

            AssertNoDuplicateConstructors(model);
        }

        [Test]
        public void TestMultipartFormDataModel_OptionalFile_DoesNotGenerateDuplicateConstructors()
        {
            var inputModel = MultipartModel(
                "OptionalFileOnlyRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("optionalFile", isRequired: false),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;

            AssertNoDuplicateConstructors(model);
        }

        [TestCase("Stream")]
        [TestCase("BinaryData")]
        public async Task TestMultipartFormDataModel_CustomizedFileType_DoesNotGenerateFileConstructors(string customType)
        {
            var inputModel = MultipartModel(
                "CustomizedFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(customType));

            var model = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ScmModel>().Single(t => t.Name == "CustomizedFileRequest");
            var file = new TypeProviderWriter(model).Write();

            Assert.IsFalse(
                file.Content.Contains("FileBinaryContent"),
                $"Customized file property should not produce FileBinaryContent constructors.\n{file.Content}");
        }

        [Test]
        public void TestFileBinaryContentConstructor_WithoutMultipartUsage_HasExperimentalAttribute()
        {
            var inputModel = MultipartModel(
                "PluginMultipartRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;

            var fileConstructors = model.Constructors
                .Where(c => c.Signature.Parameters.Any(p => ScmModel.IsFileBinaryContentType(p.Type)))
                .ToList();
            Assert.IsNotEmpty(fileConstructors, "Expected a constructor taking a FileBinaryContent parameter.");

            foreach (var constructor in fileConstructors)
            {
                if (constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal))
                {
                    Assert.IsNotEmpty(
                        constructor.Suppressions,
                        "Internal constructor with FileBinaryContent parameter should suppress the experimental diagnostic.");
                }
                else
                {
                    Assert.IsTrue(
                        constructor.Signature.Attributes.Any(a => a.Type.Equals(typeof(ExperimentalAttribute))),
                        "Public constructor with FileBinaryContent parameter should have the experimental attribute.");
                }
            }
        }

        private static void AssertNoDuplicateConstructors(ScmModel model)
        {
            var signatures = model.Constructors
                .Select(c => $"{c.Signature.Modifiers}({string.Join(",", c.Signature.Parameters.Select(p => p.Type.ToString()))})")
                .ToList();
            var duplicates = signatures
                .GroupBy(s => s)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();
            Assert.IsEmpty(
                duplicates,
                $"Model '{model.Name}' has duplicate constructor signatures: {string.Join(", ", duplicates)}.\nAll signatures: {string.Join("; ", signatures)}");
        }

        private static InputModelProperty FilePartProperty(string name, bool isRequired = true, InputModelProperty? filename = null)
            => InputFactory.Property(
                name,
                InputFactory.FileType(),
                isRequired: isRequired,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true, filename: filename)));

        private static InputModelProperty MultiFilePartProperty(string name)
            => InputFactory.Property(
                name,
                InputFactory.Array(InputFactory.FileType()),
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true, isMulti: true)));

        private static InputModelProperty NonFilePartProperty(string name, InputType type)
            => InputFactory.Property(
                name,
                type,
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: false, defaultContentTypes: ["text/plain"])));

        private static InputModelType MultipartModel(
            string name,
            IEnumerable<InputModelProperty> properties,
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.MultipartFormData)
            => InputFactory.Model(name, usage: usage, properties: properties);

    }
}
