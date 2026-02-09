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
        public void TopParameterRenamedToMaxCountInPagingOperation()
        {
            var topParameter = InputFactory.QueryParameter("top", InputPrimitiveType.Int32);
            var pagingMetadata = InputFactory.PagingMetadata(["items"], null, null);
            var responseModel = InputFactory.Model("Response", properties: [
                InputFactory.Property("items", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var response = InputFactory.OperationResponse([200], responseModel);
            var operation = InputFactory.Operation("getItems", parameters: [topParameter], responses: [response]);
            var pagingMethod = InputFactory.PagingServiceMethod("getItems", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("testClient", methods: [pagingMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [responseModel], clients: () => [client]);

            var restClientProviders = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<RestClientProvider>().ToList();

            Assert.IsTrue(restClientProviders.Count > 0, "RestClientProvider should be generated");
            
            var parameterNames = restClientProviders
                .SelectMany(p => p.Methods)
                .SelectMany(m => m.Signature.Parameters)
                .Select(param => param.Name)
                .ToList();

            Assert.Contains("maxCount", parameterNames, "Should contain 'maxCount' parameter");
            Assert.IsFalse(parameterNames.Contains("top"), "Should not contain 'top' parameter after renaming");
        }

        [Test]
        public void TopParameterConvertedToMaxCountWhenNoBackwardCompatibility()
        {
            // This test verifies that when a "top" parameter exists in the paging operation,
            // it is converted to "maxCount" when no LastContractView is present (no backward compatibility)
            var topParameter = InputFactory.QueryParameter("top", InputPrimitiveType.Int32);
            var pagingMetadata = InputFactory.PagingMetadata(["items"], null, null);
            var responseModel = InputFactory.Model("Response", properties: [
                InputFactory.Property("items", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var response = InputFactory.OperationResponse([200], responseModel);
            var operation = InputFactory.Operation("getItems", parameters: [topParameter], responses: [response]);
            var pagingMethod = InputFactory.PagingServiceMethod("getItems", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("testClient", methods: [pagingMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [responseModel], clients: () => [client]);

            var restClientProviders = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<RestClientProvider>().ToList();

            Assert.IsTrue(restClientProviders.Count > 0, "RestClientProvider should be generated");
            
            var parameterNames = restClientProviders
                .SelectMany(p => p.Methods)
                .SelectMany(m => m.Signature.Parameters)
                .Select(param => param.Name)
                .ToList();

            Assert.Contains("maxCount", parameterNames, "Should contain 'maxCount' parameter after conversion");
            Assert.IsFalse(parameterNames.Contains("top"), "Should not contain 'top' parameter after conversion to 'maxCount'");
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
            var parameter = InputFactory.QueryParameter("animalKind", InputPrimitiveType.String, isRequired: true);
            var pagingMetadata = InputFactory.PagingMetadata(["cats"], null, null);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel))]));
            var operation = InputFactory.Operation("getCats", parameters: [parameter], responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);
        }
    }
}
