// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
    }
}
