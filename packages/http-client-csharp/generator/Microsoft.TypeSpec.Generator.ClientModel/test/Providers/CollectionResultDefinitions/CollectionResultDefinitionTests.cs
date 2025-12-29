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
    public class CollectionResultDefinitionTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestCanMutateDefinition()
        {
            CreatePagingOperation(InputResponseLocation.Body);
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult");
            Assert.IsNotNull(collectionResultDefinition);

            var restClientProvider = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is RestClientProvider && t.Name == "CatClient");
            Assert.IsNotNull(restClientProvider);
            var constructors = collectionResultDefinition!.Constructors;

            var createdRequestMethod = restClientProvider!.Methods
                .FirstOrDefault(m => m.Signature.Name == "CreateGetCatsRequest");
            Assert.IsNotNull(createdRequestMethod);

            // update the create request method signature
            var currentSignature = createdRequestMethod!.Signature;
            createdRequestMethod.Update(signature: new MethodSignature(
                currentSignature.Name,
                currentSignature.Description,
                currentSignature.Modifiers,
                currentSignature.ReturnType,
                currentSignature.ReturnDescription,
                [],
                currentSignature.Attributes));

            // reset
            collectionResultDefinition.Reset();
            constructors = collectionResultDefinition!.Constructors;
            Assert.IsNotEmpty(constructors);

            var ctor = constructors[0];
            var ctorParameters = ctor.Signature.Parameters;

            // should now only have the client name parameter
            Assert.AreEqual(1, ctorParameters.Count);
        }

        [Test]
        public void TestPageSizeRootFieldSetWhenPageSizeParameterSegmentsPopulated()
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var continuationParameter = InputFactory.QueryParameter("myToken", InputPrimitiveType.String, isRequired: true);
            var pageSizeParameter = InputFactory.QueryParameter("pageSize", InputPrimitiveType.Int32, isRequired: false);
            var pagingMetadata = InputFactory.ContinuationTokenPagingMetadata(
                continuationParameter,
                ["cats"],
                ["nextPage"],
                InputResponseLocation.Body,
                ["pageSize"]);
            var catsProperty = InputFactory.Property("cats", InputFactory.Array(inputModel));
            var nextCatProperty = InputFactory.Property("nextPage", InputPrimitiveType.String);
            var pageSizeProperty = InputFactory.Property("pageSize", InputPrimitiveType.Int32);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [catsProperty, nextCatProperty, pageSizeProperty]));
            var operation = InputFactory.Operation("getCats", parameters: [continuationParameter, pageSizeParameter], responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult") as CollectionResultDefinition;
            Assert.IsNotNull(collectionResultDefinition);
            Assert.IsNotNull(collectionResultDefinition!.PageSizeField);
            Assert.AreEqual("_pageSize", collectionResultDefinition.PageSizeField!.Name);
        }

        [Test]
        public void TestPageSizeNestedFieldSetWhenMultiplePageSizeParameterSegments()
        {
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var continuationParameter = InputFactory.QueryParameter("myToken", InputPrimitiveType.String, isRequired: true);
            var pageSizeParameter = InputFactory.QueryParameter("pageSize", InputPrimitiveType.Int32, isRequired: false);
            var pagingMetadata = InputFactory.ContinuationTokenPagingMetadata(
                continuationParameter,
                ["cats"],
                ["nextPage"],
                InputResponseLocation.Body,
                ["nested", "pageSize"]);
            var pageSizeProperty = InputFactory.Property("pageSize", InputPrimitiveType.Int32);
            var nestedProperty = InputFactory.Property("nested", InputFactory.Model("nested", properties: [pageSizeProperty]));
            var catsProperty = InputFactory.Property("cats", InputFactory.Array(inputModel));
            var nextCatProperty = InputFactory.Property("nextPage", InputPrimitiveType.String);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [catsProperty, nextCatProperty, nestedProperty]));
            var operation = InputFactory.Operation("getCats", parameters: [continuationParameter, pageSizeParameter], responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult") as CollectionResultDefinition;
            Assert.IsNotNull(collectionResultDefinition);
            Assert.IsNotNull(collectionResultDefinition!.PageSizeField);
            Assert.AreEqual("_pageSize", collectionResultDefinition.PageSizeField!.Name);
        }

        [Test]
        public void TestEmptyStringHandlingForStringContinuationToken()
        {
            // Test that empty strings are handled gracefully for string continuation tokens
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var continuationParameter = InputFactory.QueryParameter("myToken", InputPrimitiveType.String, isRequired: true);
            var pagingMetadata = InputFactory.ContinuationTokenPagingMetadata(
                continuationParameter,
                ["cats"],
                ["nextPage"],
                InputResponseLocation.Body);
            var catsProperty = InputFactory.Property("cats", InputFactory.Array(inputModel));
            var nextCatProperty = InputFactory.Property("nextPage", InputPrimitiveType.String);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [catsProperty, nextCatProperty]));
            var operation = InputFactory.Operation("getCats", parameters: [continuationParameter], responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult") as CollectionResultDefinition;
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            
            // Verify the generated code includes empty string check
            Assert.IsTrue(file.Content.Contains("string.IsNullOrEmpty"), 
                "Generated code should check for empty strings in continuation tokens");
        }

        [Test]
        public void TestEmptyStringHandlingForUriNextLink()
        {
            // Test that empty strings are handled gracefully for URI next links
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata(["cats"], ["nextCat"], InputResponseLocation.Body);
            var catsProperty = InputFactory.Property("cats", InputFactory.Array(inputModel));
            var nextCatProperty = InputFactory.Property("nextCat", InputPrimitiveType.Url);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [catsProperty, nextCatProperty]));
            var operation = InputFactory.Operation("getCats", responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("getCats", operation, pagingMetadata: pagingMetadata);
            var client = InputFactory.Client("catClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [client]);

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "CatClientGetCatsCollectionResult") as CollectionResultDefinition;
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();
            
            // Verify the generated code handles URI types correctly (null check is sufficient for Uri type)
            Assert.IsTrue(file.Content.Contains("if ((nextPageUri == null))"), 
                "Generated code should check for null URI");
        }

        internal static void CreatePagingOperation(InputResponseLocation responseLocation, bool isNested = false)
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
