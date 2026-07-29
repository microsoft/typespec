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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body, isNested: true);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body, isNested: true);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Header);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Header);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body, isNested: true);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Body, isNested: true);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Header);

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
            CollectionResultDefinitionTests.CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
