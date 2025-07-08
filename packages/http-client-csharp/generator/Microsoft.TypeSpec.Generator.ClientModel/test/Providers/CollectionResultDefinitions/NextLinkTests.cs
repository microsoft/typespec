// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInBodyAsync()
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
        public void NextLinkInHeader()
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
        public void NextLinkInHeaderAsync()
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
        public void NextLinkInBodyOfT()
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
        public void NextLinkInBodyOfTAsync()
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
        public void NextLinkInHeaderOfT()
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
        public void NextLinkInHeaderOfTAsync()
        {
            CreatePagingOperation(InputResponseLocation.Header);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsAsyncCollectionResultOfT");
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void NextLinkInBodyMultipleClients()
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata("cats", "nextCat", InputResponseLocation.Body);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel)), InputFactory.Property("nextCat", InputPrimitiveType.Url)]));
            var operation = InputFactory.Operation("getCats", responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var catClient = InputFactory.Client("catClient", methods: [inputServiceMethod], clientNamespace: "Cats");
            var felineClient = InputFactory.Client("felineClient", methods: [inputServiceMethod], clientNamespace: "Felines");
            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [catClient, felineClient]);

            var catClientCollectionResult = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(catClientCollectionResult);
            Assert.AreEqual("Cats", catClientCollectionResult!.Type.Namespace);

            var felineClientCollectionResult = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "FelineClientGetCatsCollectionResult");
            Assert.IsNotNull(felineClientCollectionResult);
            Assert.AreEqual("Felines", felineClientCollectionResult!.Type.Namespace);
        }

        [Test]
        public void UsesValidFieldIdentifierNames()
        {
            MockHelpers.LoadMockGenerator();
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata("cats", "nextCat", InputResponseLocation.Body);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel)), InputFactory.Property("nextCat", InputPrimitiveType.Url)]));
            IReadOnlyList<InputParameter> parameters = [InputFactory.Parameter("$foo", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Header)];
            var operation = InputFactory.Operation("getCats", responses: [response], parameters: parameters);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata, parameters: parameters);
            var catClient = InputFactory.Client("catClient", methods: [inputServiceMethod], clientNamespace: "Cats");
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(catClient);
            var modelType = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
            var collectionResultDefinition = new CollectionResultDefinition(clientProvider!, inputServiceMethod, modelType!.Type, false);
            var fields = collectionResultDefinition.Fields;

            Assert.IsTrue(fields.Any(f => f.Name == "_foo"));
        }

        [Test]
        public void NextLinkWithStringType()
        {
            // Test to reproduce the issue where nextLink can be a string instead of URL
            MockHelpers.LoadMockGenerator();
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata("cats", "nextCat", InputResponseLocation.Body);
            
            // Define the page model with string nextCat property
            var pageModel = InputFactory.Model(
                "page",
                usage: InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: [
                    InputFactory.Property("cats", InputFactory.Array(inputModel)), 
                    InputFactory.Property("nextCat", InputPrimitiveType.String) // This is the key change - String instead of Url
                ]);
            
            var response = InputFactory.OperationResponse([200], pageModel);
            var operation = InputFactory.Operation("getCats", responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            try 
            {
                MockHelpers.LoadMockGenerator(inputModels: () => [inputModel, pageModel], clients: () => [client]);

                // Check if the collection result is generated
                var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                    t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
                
                if (collectionResultDefinition != null)
                {
                    var writer = new TypeProviderWriter(collectionResultDefinition!);
                    var file = writer.Write();
                    Assert.IsNotNull(file.Content);
                    System.Console.WriteLine("Collection result generated successfully");
                }
                else
                {
                    System.Console.WriteLine("Collection result is null");
                }

                // Now check if the response model is generated 
                var pageModelProvider = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                    t => t is ModelProvider && t.Name == "Page");
                
                if (pageModelProvider != null)
                {
                    System.Console.WriteLine("Page model found");
                    // Try to generate serialization code for the Page model
                    var pageWriter = new TypeProviderWriter(pageModelProvider);
                    var pageFile = pageWriter.Write();
                    Assert.IsNotNull(pageFile.Content);
                    System.Console.WriteLine("Page model generated successfully");
                    
                    // Check the content contains string property instead of URI
                    var content = pageFile.Content;
                    System.Console.WriteLine($"Generated Page model content:\n{content}");
                    
                    Assert.IsTrue(content.Contains("string NextCat") || content.Contains("string nextCat"), "nextCat should be generated as string property");
                    Assert.IsFalse(content.Contains("Uri NextCat") || content.Contains("Uri nextCat"), "nextCat should not be generated as Uri property");
                    
                    // Check that the property is correctly typed as string
                    Assert.IsTrue(content.Contains("public string NextCat"), "NextCat property should be public string");
                }
                else
                {
                    Assert.Fail("Page model should be generated when nextLink is a string");
                }
                
                // The main test - verify that string nextLink properties are handled correctly
                // This test passes, meaning the issue may be more specific than general string handling
                System.Console.WriteLine("✓ String nextLink properties are correctly generated as string type");
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"Exception during model generation: {ex.Message}");
                System.Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
        
        [Test]
        public void NextLinkStringVsUrlComparison()
        {
            // Test to compare behavior between URL and String nextLink properties
            MockHelpers.LoadMockGenerator();
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata("cats", "nextCat", InputResponseLocation.Body);
            
            // Test URL type (existing behavior)
            var pageModelUrl = InputFactory.Model(
                "pageUrl",
                usage: InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: [
                    InputFactory.Property("cats", InputFactory.Array(inputModel)), 
                    InputFactory.Property("nextCat", InputPrimitiveType.Url) // URL type
                ]);
                
            // Test String type (the issue being addressed)
            var pageModelString = InputFactory.Model(
                "pageString",
                usage: InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: [
                    InputFactory.Property("cats", InputFactory.Array(inputModel)), 
                    InputFactory.Property("nextCat", InputPrimitiveType.String) // String type
                ]);
            
            var responseUrl = InputFactory.OperationResponse([200], pageModelUrl);
            var responseString = InputFactory.OperationResponse([200], pageModelString);
            var operationUrl = InputFactory.Operation("getCatsUrl", responses: [responseUrl]);
            var operationString = InputFactory.Operation("getCatsString", responses: [responseString]);
            var inputServiceMethodUrl = InputFactory.PagingServiceMethod("getCatsUrl", operationUrl, pagingMetadata: pagingMetadata);
            var inputServiceMethodString = InputFactory.PagingServiceMethod("getCatsString", operationString, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethodUrl, inputServiceMethodString]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel, pageModelUrl, pageModelString], clients: () => [client]);

            // Check URL model
            var pageModelUrlProvider = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is ModelProvider && t.Name == "PageUrl");
            Assert.IsNotNull(pageModelUrlProvider, "PageUrl model should be generated");
            
            var urlWriter = new TypeProviderWriter(pageModelUrlProvider!);
            var urlFile = urlWriter.Write();
            System.Console.WriteLine($"URL NextCat model:\n{urlFile.Content}");
            Assert.IsTrue(urlFile.Content.Contains("Uri NextCat") || urlFile.Content.Contains("Uri nextCat"), "URL nextCat should be generated as Uri property");
            
            // Check String model  
            var pageModelStringProvider = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is ModelProvider && t.Name == "PageString");
            Assert.IsNotNull(pageModelStringProvider, "PageString model should be generated");
            
            var stringWriter = new TypeProviderWriter(pageModelStringProvider!);
            var stringFile = stringWriter.Write();
            System.Console.WriteLine($"String NextCat model:\n{stringFile.Content}");
            Assert.IsTrue(stringFile.Content.Contains("string NextCat") || stringFile.Content.Contains("string nextCat"), "String nextCat should be generated as string property");
            
            System.Console.WriteLine("✓ Both URL and String nextLink types are correctly handled");
        }


        private static void CreatePagingOperation(InputResponseLocation responseLocation)
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata("cats", "nextCat", responseLocation);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel)), InputFactory.Property("nextCat", InputPrimitiveType.Url)]));
            var operation = InputFactory.Operation("getCats", responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);
        }
    }
}
