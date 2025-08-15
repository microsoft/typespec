// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.CollectionResultDefinitions
{
    public class ContinuationTokenTests
    {
        [Test]
        public void ContinuationTokenInBody()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ContinuationTokenInBodyAsync()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NestedContinuationTokenInBody()
        {
            CreatePagingOperation(InputResponseLocation.Body, isNested: true);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NestedContinuationTokenInBodyAsync()
        {
            CreatePagingOperation(InputResponseLocation.Body, isNested: true);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ContinuationTokenInHeader()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ContinuationTokenInHeaderAsync()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ContinuationTokenInBodyOfT()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ContinuationTokenInBodyOfTAsync()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NestedContinuationTokenInBodyOfT()
        {
            CreatePagingOperation(InputResponseLocation.Body, isNested: true);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NestedContinuationTokenInBodyOfTAsync()
        {
            CreatePagingOperation(InputResponseLocation.Body, isNested: true);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ContinuationTokenInHeaderOfT()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ContinuationTokenInHeaderOfTAsync()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private static void CreatePagingOperation(InputResponseLocation responseLocation, bool isNested = false)
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var parameter = InputFactory.QueryParameter("myToken", InputPrimitiveType.String, isRequired: true);
            var pagingMetadata = isNested ?
                InputFactory.ContinuationTokenPagingMetadata(parameter, ["nestedItems", "cats"], ["nestedNext", "nextPage"], responseLocation)
                : InputFactory.ContinuationTokenPagingMetadata(parameter, ["cats"], ["nextPage"], responseLocation);
            var catsProperty = InputFactory.Property("cats", InputFactory.Array(inputModel));
            var nextCatProperty = InputFactory.Property("nextPage", InputPrimitiveType.String);
            IEnumerable<InputModelProperty> properties = isNested
                ?
                [
                    InputFactory.Property("nestedItems", InputFactory.Model("nestedItems", properties: [catsProperty])),
                    InputFactory.Property("nestedNext", InputFactory.Model("nestedNext", properties: [nextCatProperty]))
                ]
                : [catsProperty, nextCatProperty];
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: properties));
            var operation = InputFactory.Operation("getCats", parameters: [parameter], responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);
        }
    }
}
