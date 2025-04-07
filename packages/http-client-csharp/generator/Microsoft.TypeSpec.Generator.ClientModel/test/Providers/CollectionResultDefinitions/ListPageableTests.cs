// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.CollectionResultDefinitions
{
    public class ListPageableTests
    {
        [Test]
        public void NoNextLinkOrContinuationToken()
        {
            CreatePagingOperation();

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NoNextLinkOrContinuationTokenAsync()
        {
            CreatePagingOperation();

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NoNextLinkOrContinuationTokenOfT()
        {
            CreatePagingOperation();

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NoNextLinkOrContinuationTokenOfTAsync()
        {
            CreatePagingOperation();

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private static void CreatePagingOperation()
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var parameter = InputFactory.Parameter("animalKind", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query);
            var paging = new InputOperationPaging(["cats"], null, null);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel))]));
            var operation = InputFactory.Operation("getCats", parameters: [parameter], paging: paging, responses: [response]);
            var client = InputFactory.Client("catClient", operations: [operation]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);
        }
    }
}
