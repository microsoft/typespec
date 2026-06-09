// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// cspell:ignore mpfd

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    public class ScmTypeFactoryTests
    {
        [Test]
        public void RootInputModelsIncludesOperationParameters()
        {
            var inputModel = InputFactory.Model("foo");
            var parameter = InputFactory.BodyParameter("Id", inputModel, serializedName: "Id");
            var operation = InputFactory.Operation("TestOperation", "Samples", [parameter], []);
            var serviceMethod = InputFactory.BasicServiceMethod("TestMethod", operation);
            var client = InputFactory.Client("TestClient", "Samples", "", [serviceMethod]);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [inputModel],
                clients: () => [client]);

            var scmTypeFactory = generator.Object.TypeFactory;
            var rootModels = scmTypeFactory.RootInputModels;

            Assert.IsNotNull(rootModels);
            Assert.AreEqual(1, rootModels.Count);
            Assert.IsTrue(rootModels.Contains(inputModel));
        }

        [Test]
        public void RootOutputModelsIncludesOperationResponse()
        {
            var inputModel = InputFactory.Model("foo");
            var operation = InputFactory.Operation("TestOperation", "Samples", [], responses: [InputFactory.OperationResponse(bodytype: inputModel)]);
            var serviceMethod = InputFactory.BasicServiceMethod(
                "TestMethod",
                operation);
            var client = InputFactory.Client("TestClient", "Samples", "", [serviceMethod]);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [inputModel],
                clients: () => [client]);

            var scmTypeFactory = generator.Object.TypeFactory;
            var rootModels = scmTypeFactory.RootOutputModels;

            Assert.IsNotNull(rootModels);
            Assert.AreEqual(1, rootModels.Count);
            Assert.IsTrue(rootModels.Contains(inputModel));
        }

        [Test]
        public void RootOutputModelsIncludesServiceResponse()
        {
            var inputModel = InputFactory.Model("foo");
            var operation = InputFactory.Operation("TestOperation", "Samples");
            var serviceMethod = InputFactory.BasicServiceMethod(
                "TestMethod",
                operation,
                response: InputFactory.ServiceMethodResponse(inputModel, []));
            var client = InputFactory.Client("TestClient", "Samples", "", [serviceMethod]);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [inputModel],
                clients: () => [client]);

            var scmTypeFactory = generator.Object.TypeFactory;
            var rootModels = scmTypeFactory.RootOutputModels;

            Assert.IsNotNull(rootModels);
            Assert.AreEqual(1, rootModels.Count);
            Assert.IsTrue(rootModels.Contains(inputModel));
        }

        [Test]
        public void RootOutputModelsIncludesUnionVariantTypesServiceResponse()
        {
            var variantAModel = InputFactory.Model("VariantAModel");
            var variantBModel = InputFactory.Model("VariantBModel");
            var variantCModel = InputFactory.Model("VariantCModel");
            var unionInputType = InputFactory.Union(
            [
                variantAModel,
                variantBModel,
                new InputNullableType(variantCModel),
                InputPrimitiveType.Any
            ],
            "MyUnion");
            var someOtherNonRootModel = InputFactory.Model("SomeOtherNonRootModel");
            var operation = InputFactory.Operation("TestOperation", "Samples");
            var serviceMethod = InputFactory.BasicServiceMethod(
                "TestMethod",
                operation,
                response: InputFactory.ServiceMethodResponse(unionInputType, []));
            var client = InputFactory.Client("TestClient", "Samples", "", [serviceMethod]);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [variantAModel, variantBModel, variantCModel, someOtherNonRootModel],
                clients: () => [client]);

            var scmTypeFactory = generator.Object.TypeFactory;
            var rootModels = scmTypeFactory.RootOutputModels;

            Assert.IsNotNull(rootModels);
            Assert.AreEqual(3, rootModels.Count);
            Assert.IsTrue(rootModels.Contains(variantAModel));
            Assert.IsTrue(rootModels.Contains(variantBModel));
            Assert.IsTrue(rootModels.Contains(variantCModel));
        }

        [Test]
        public void TestCreateSerializations_ReturnsMultipartOnly_ForMpfdOnlyModel()
        {
            var inputModel = MultipartModel("FileRequest", [FilePartProperty("profileImage")]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var serializations = ScmCodeModelGenerator.Instance.TypeFactory.CreateSerializations(inputModel, model);

            Assert.AreEqual(1, serializations.Count);
            Assert.IsInstanceOf<MultipartFormDataSerializationDefinition>(serializations[0]);
        }

        [Test]
        public void TestCreateSerializations_ReturnsBothMrwAndMultipart_WhenJsonAndMpfdUsage()
        {
            var inputModel = MultipartModel(
                "MixedUsageRequest",
                [FilePartProperty("profileImage")],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var serializations = ScmCodeModelGenerator.Instance.TypeFactory.CreateSerializations(inputModel, model);

            Assert.AreEqual(2, serializations.Count);
            Assert.IsTrue(serializations.Any(s => s is MrwSerializationTypeDefinition),
                "Expected a JSON (MRW) serialization provider for a model with Json usage.");
            Assert.IsTrue(serializations.Any(s => s is MultipartFormDataSerializationDefinition),
                "Expected a multipart serialization provider for a model with MultipartFormData usage.");
        }

        private static InputModelProperty FilePartProperty(string name)
            => InputFactory.Property(
                name,
                InputFactory.FileType(),
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true)));

        private static InputModelType MultipartModel(
            string name,
            IEnumerable<InputModelProperty> properties,
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.MultipartFormData)
            => InputFactory.Model(name, usage: usage, properties: properties);
    }
}
