// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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
        public async Task PropagateCustomizedDynamicProperty()
        {
            var otherDynamicModel = InputFactory.Model(
                "foo",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("someOtherProperty", InputPrimitiveType.String, isRequired: true)
                ]);

            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("prop1", otherDynamicModel, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel, otherDynamicModel]);
            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>().FirstOrDefault(m => m.Name == "DynamicModel");

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);

            // Also validate that the propagate method is called from the serialization constructor
            var constructor =
                model.Constructors.FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "patch"));
            Assert.IsNotNull(constructor);
            StringAssert.Contains("_patch.SetPropagators(PropagateSet, PropagateGet);", constructor!.BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task DoesNotPropagateDynamicPropertyWithNoWireInfo()
        {
            var otherDynamicModel = InputFactory.Model(
                "foo",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("someOtherProperty", InputPrimitiveType.String, isRequired: true)
                ]);

            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("prop1", InputPrimitiveType.String, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel, otherDynamicModel]);
            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>().FirstOrDefault(m => m.Name == "DynamicModel");

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);
            Assert.IsFalse(serialization!.Methods.Any(m => m.Signature.Name is "PropagateGet" or "PropagateSet"));
        }

        [Test]
        public async Task PropagateCustomizedDynamicPropertyMixed()
        {
            var otherDynamicModel = InputFactory.Model(
                "foo",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("someOtherProperty", InputPrimitiveType.String, isRequired: true)
                ]);

            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("prop1", otherDynamicModel, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel, otherDynamicModel]);
            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>().FirstOrDefault(m => m.Name == "DynamicModel");

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);

            // Also validate that the propagate method is called from the serialization constructor
            var constructor =
                model.Constructors.FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "patch"));
            Assert.IsNotNull(constructor);
            StringAssert.Contains("_patch.SetPropagators(PropagateSet, PropagateGet);", constructor!.BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task DoesNotPropagateListDynamicPropertyWithNoWireInfo()
        {
            var otherDynamicModel = InputFactory.Model(
                "foo",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("someOtherProperty", InputPrimitiveType.String, isRequired: true)
                ]);

            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("prop1", InputPrimitiveType.String, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel, otherDynamicModel]);
            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>().FirstOrDefault(m => m.Name == "DynamicModel");

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);
            Assert.IsFalse(serialization!.Methods.Any(m => m.Signature.Name is "PropagateGet" or "PropagateSet"));
        }

        [Test]
        public async Task PropagateCustomizedDynamicListProperty()
        {
            var otherDynamicModel = InputFactory.Model(
                "foo",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("someOtherProperty", InputPrimitiveType.String, isRequired: true)
                ]);

            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("prop1", InputFactory.Array(otherDynamicModel), isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel, otherDynamicModel]);
            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>().FirstOrDefault(m => m.Name == "DynamicModel");

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);

            // Also validate that the propagate method is called from the serialization constructor
            var constructor =
                model.Constructors.FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "patch"));
            Assert.IsNotNull(constructor);
            StringAssert.Contains("_patch.SetPropagators(PropagateSet, PropagateGet);", constructor!.BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task PropagateCustomizedDynamicListPropertyMixed()
        {
            var otherDynamicModel = InputFactory.Model(
                "foo",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("someOtherProperty", InputPrimitiveType.String, isRequired: true)
                ]);

            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("prop1", InputFactory.Array(otherDynamicModel), isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel, otherDynamicModel]);
            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.OfType<ClientModel.Providers.ScmModelProvider>().FirstOrDefault(m => m.Name == "DynamicModel");

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "PropagateGet" or "PropagateSet"));

            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);

            // Also validate that the propagate method is called from the serialization constructor
            var constructor =
                model.Constructors.FirstOrDefault(c => c.Signature.Parameters.Any(p => p.Name == "patch"));
            Assert.IsNotNull(constructor);
            StringAssert.Contains("_patch.SetPropagators(PropagateSet, PropagateGet);", constructor!.BodyStatements!.ToDisplayString());
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
        public async Task WriteReadOnlySpanProperty()
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
                   InputFactory.Property("someSpan", InputFactory.Array(InputPrimitiveType.String), isRequired: false, isReadOnly: true)
               ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel]);
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
        public void WriteModelWithAdditionalProperties()
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
                   InputFactory.Property("cats", catModel),
               ],
               additionalProperties: InputPrimitiveType.String);

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
        public void WriteDiscriminatedBaseModel()
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
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel }, { "dog", dogModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dogModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(baseModel) as ClientModel.Providers.ScmModelProvider;

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
        public void WriteDiscriminatedDerivedModel()
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
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel }, { "dog", dogModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dogModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.HasDynamicModelSupport);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name is "JsonModelWriteCore" or "Write"));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void WriteBaseModel()
        {
            var catModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                derivedModels: [catModel],
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(baseModel) as ClientModel.Providers.ScmModelProvider;

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
        public void WriteDerivedModel()
        {
            var catModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                derivedModels: [catModel],
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.HasDynamicModelSupport);
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

        // This test validates that additional properties are properly deserialized in dynamic models.
        [Test]
        public void DeserializeModelWithAP()
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
                   InputFactory.Property("cats", catModel),
               ],
               additionalProperties: InputPrimitiveType.String);

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

        [TestCase(true)]
        [TestCase(false)]
        public void ExplicitClientResultOperator(bool isDynamicModel)
        {
            var inputModel = InputFactory.Model(
               "cat",
               isDynamicModel: isDynamicModel,
               properties:
               [
                    InputFactory.Property("foo", InputPrimitiveType.String, isRequired: true),
               ]);
            var operation = InputFactory.Operation(
                "getCat",
                parameters: [
                    InputFactory.PathParameter("catId", InputPrimitiveType.String, isRequired: true)
                ],
                responses: [
                    InputFactory.OperationResponse(
                        statusCodes: [200],
                        bodytype: inputModel)
                ]);
            var method = InputFactory.BasicServiceMethod("GetCat", operation);
            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [InputFactory.Client("TestClient", methods: [method])]);

            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ClientModel.Providers.ScmModelProvider;

            Assert.IsNotNull(model);
            Assert.AreEqual(2, model!.Constructors.Count);
            Assert.AreEqual(isDynamicModel, model.IsDynamicModel);
            var serialization = model.SerializationProviders.SingleOrDefault();
            Assert.IsNotNull(serialization);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serialization!,
                name => name.StartsWith("Cat")));

            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(isDynamicModel.ToString()), file.Content);
        }
    }
}
