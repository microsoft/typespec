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
                        isDynamic: true,
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
                            isDynamic: true,
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
                            isDynamic: true,
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
                            isDynamic: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))),
                    InputFactory.Property("p2",
                        InputFactory.Array(InputFactory.Model(
                            "dynamicArray",
                            isDynamic: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))),
                    InputFactory.Property("p3",
                        InputFactory.Array(InputFactory.Model(
                            "anotherDynamic",
                            isDynamic: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))),
                    InputFactory.Property("p4",
                        InputFactory.Array(InputFactory.Array(InputFactory.Model(
                            "dynamicArray",
                            isDynamic: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ])))),
                    InputFactory.Property("p5",
                        InputFactory.Array(InputFactory.Array(InputFactory.Array(InputFactory.Model(
                            "dynamicArray",
                            isDynamic: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))))),
                    InputFactory.Property("p6",
                        InputFactory.Dictionary(InputFactory.Array(InputFactory.Model(
                            "dynamicDictionary",
                            isDynamic: true,
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
    }
}
