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
    public class NextLinkTests
    {
        [Test]
        public void NextLinkInBody()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInBodyAsync()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsAsyncCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInHeader()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInHeaderAsync()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsAsyncCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInBodyOfT()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInBodyOfTAsync()
        {
            CreatePagingOperation(InputResponseLocation.Body);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInHeaderOfT()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInHeaderOfTAsync()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelPlugin.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }


        private static void CreatePagingOperation(InputResponseLocation responseLocation)
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var paging = InputFactory.NextLinkOperationPaging("cats", "nextCat", responseLocation);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel)), InputFactory.Property("nextCat", InputPrimitiveType.Url)]));
            var operation = InputFactory.Operation("getCats", paging: paging, responses: [response]);
            var client = InputFactory.Client("catClient", operations: [operation]);

            MockHelpers.LoadMockPlugin(inputModels: () => [inputModel], clients: () => [client]);
        }
    }
}
