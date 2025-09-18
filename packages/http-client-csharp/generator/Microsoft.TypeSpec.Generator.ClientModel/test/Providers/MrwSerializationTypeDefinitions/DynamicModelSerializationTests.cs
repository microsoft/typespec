// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class DynamicModelSerializationTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void PropagateNoDynamicProperties()
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
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void PropagateModelProperty()
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
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void PropagateModelListProperty()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("p1",
                        InputFactory.Array(InputFactory.Model(
                            "anotherDynamic",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ])))
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void PropagateModelDictionaryProperty()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("p1",
                        InputFactory.Dictionary(InputFactory.Model(
                            "anotherDynamic",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ])))
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void PropagateMultipleDynamicProperties()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("p1",
                        InputFactory.Dictionary(InputFactory.Model(
                            "dynamicDictionary",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))),
                    InputFactory.Property("p2",
                        InputFactory.Array(InputFactory.Model(
                            "dynamicArray",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))),
                    InputFactory.Property("p3",
                        InputFactory.Array(InputFactory.Model(
                            "anotherDynamic",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))),
                    InputFactory.Property("p4",
                        InputFactory.Array(InputFactory.Array(InputFactory.Model(
                            "dynamicArray",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ])))),
                    InputFactory.Property("p5",
                        InputFactory.Array(InputFactory.Array(InputFactory.Array(InputFactory.Model(
                            "dynamicArray",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))))),
                    InputFactory.Property("p6",
                        InputFactory.Dictionary(InputFactory.Array(InputFactory.Model(
                            "dynamicDictionary",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ])))),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteMultiplePrimitiveProperties()
        {
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                    InputFactory.Property("foo", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("cat", InputPrimitiveType.String, serializedName: "x-cat", isRequired: true),
                    InputFactory.Property("bar", InputPrimitiveType.Int32, isRequired: false)
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteModelPropertyType()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                    InputFactory.Property("cat", catModel, isRequired: false),
                    InputFactory.Property("anything", InputPrimitiveType.Any, isRequired: true)
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteArrayProperties()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("cats", InputFactory.Array(catModel), isRequired: false),
                   InputFactory.Property("names", InputFactory.Array(InputPrimitiveType.String), isRequired: true),
                   InputFactory.Property("optionalNames", InputFactory.Array(InputPrimitiveType.String), isRequired: false),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteNestedArrayPrimitiveProperties()
        {
            var array1 = InputFactory.Array(InputPrimitiveType.String);
            var array2 = InputFactory.Array(array1);
            var array3 = InputFactory.Array(array2);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("propertyWithNestedArray", array3),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteNestedArrayDynamicModelProperties()
        {
            var dynamicCat = InputFactory.Model("dynamicCat", isDynamicModel: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var array1 = InputFactory.Array(dynamicCat);
            var array2 = InputFactory.Array(array1);
            var array3 = InputFactory.Array(array2);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("propertyWithNestedArray", array3),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteNestedArrayDictionaryProperties()
        {
            var array1 = InputFactory.Array(InputFactory.Dictionary(InputPrimitiveType.String));
            var array2 = InputFactory.Array(array1);
            var array3 = InputFactory.Array(array2);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("propertyWithNestedArray", array3),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteDictionaryProperties()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("cats", InputFactory.Dictionary(catModel), isRequired: false),
                   InputFactory.Property("names", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: true),
                   InputFactory.Property("optionalNames", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: false),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteNestedDictPrimitiveProperties()
        {
            var dict1 = InputFactory.Dictionary(InputPrimitiveType.String);
            var dict2 = InputFactory.Dictionary(dict1);
            var dict3 = InputFactory.Dictionary(dict2);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("propertyWithNestedDictionary", dict3),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteNestedDictDynamicModelProperties()
        {
            var dynamicCat = InputFactory.Model("dynamicCat", isDynamicModel: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var dict1 = InputFactory.Dictionary(dynamicCat);
            var dict2 = InputFactory.Dictionary(dict1);
            var dict3 = InputFactory.Dictionary(dict2);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("propertyWithNestedDictionary", dict3),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void DeserializeMultiplePrimitiveProperties()
        {
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                    InputFactory.Property("foo", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("cat", InputPrimitiveType.String, serializedName: "x-cat", isRequired: true),
                    InputFactory.Property("bar", InputPrimitiveType.Int32, isRequired: false)
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.AreEqual(2, model!.Constructors.Count);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name.StartsWith("Deserialize")));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void DeserializeModelPropertyType()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                    InputFactory.Property("cat", catModel, isRequired: false),
                    InputFactory.Property("anything", InputPrimitiveType.Any, isRequired: true)
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.AreEqual(2, model!.Constructors.Count);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name.StartsWith("Deserialize")));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void DeserializeArrayProperties()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("cats", InputFactory.Array(catModel), isRequired: false),
                   InputFactory.Property("names", InputFactory.Array(InputPrimitiveType.String), isRequired: true),
                   InputFactory.Property("optionalNames", InputFactory.Array(InputPrimitiveType.String), isRequired: false),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.AreEqual(2, model!.Constructors.Count);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name.StartsWith("Deserialize")));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void DeserializeDictionaryProperties()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var inputModel = InputFactory.Model(
               "dynamicModel",
               isDynamicModel: true,
               properties:
               [
                   InputFactory.Property("cats", InputFactory.Dictionary(catModel), isRequired: false),
                   InputFactory.Property("names", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: true),
                   InputFactory.Property("optionalNames", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: false),
               ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.AreEqual(2, model!.Constructors.Count);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name.StartsWith("Deserialize")));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
