// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.CollectionResultDefinitions
{
    public class CollectionResultDefinitionTests
    {
        [Test]
        public void PagingHelpersAreNestedInClientCollectionsFile()
        {
            CreatePagingOperation(InputResponseLocation.Body);
            var types = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders;
            var client = types.OfType<ClientProvider>().Single();
            var collections = types.SingleOrDefault(t => t.RelativeFilePath == Path.Combine("src", "Generated", "CatClient.Collections.cs"));

            Assert.IsNotNull(collections);
            Assert.AreSame(client.CollectionResultProviders, collections);
            Assert.AreSame(client.CollectionResultProviders, client.CollectionResultProviders);
            Assert.AreEqual(client.Name, collections!.Name);
            Assert.AreEqual(client.DeclarationModifiers, collections.DeclarationModifiers);
            Assert.AreEqual(4, collections.NestedTypes.Count);
            Assert.IsFalse(types.Any(t => t is CollectionResultDefinition));
            CollectionAssert.AreEquivalent(
                new[] { "GetCatsCollectionResult", "GetCatsAsyncCollectionResult", "GetCatsCollectionResultOfT", "GetCatsAsyncCollectionResultOfT" },
                collections.NestedTypes.Select(helper => helper.Name));
            foreach (var helper in collections.NestedTypes)
            {
                Assert.IsInstanceOf<CollectionResultDefinition>(helper);
                Assert.AreSame(client, helper.DeclaringTypeProvider);
                Assert.AreEqual(client.Type, helper.Type.DeclaringType);
            }
        }

        [Test]
        public void NonPagingClientsDoNotHaveCollectionsFiles()
        {
            var operation = InputFactory.Operation("Get");
            var client = InputFactory.Client("TestClient", methods: [InputFactory.BasicServiceMethod("Get", operation)]);
            MockHelpers.LoadMockGenerator(clients: () => [client]);

            Assert.IsFalse(ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .Any(t => t.RelativeFilePath.EndsWith(".Collections.cs")));
        }

        [Test]
        public void CollectionFilePathDoesNotIncludeLongOperationNames()
        {
            var item = InputFactory.Model("Item");
            var page = InputFactory.Model("Page", properties: [InputFactory.Property("items", InputFactory.Array(item))]);
            var operation = InputFactory.Operation(new string('a', 300), responses: [InputFactory.OperationResponse(bodytype: page)]);
            var method = InputFactory.PagingServiceMethod(operation.Name, operation, pagingMetadata: InputFactory.PagingMetadata(["items"], null, null));
            var client = InputFactory.Client("TestClient", methods: [method]);
            MockHelpers.LoadMockGenerator(inputModels: () => [item, page], clients: () => [client]);

            var collections = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .SingleOrDefault(t => t.RelativeFilePath.EndsWith(".Collections.cs"));

            Assert.IsNotNull(collections);
            Assert.AreEqual(Path.Combine("src", "Generated", "TestClient.Collections.cs"), collections!.RelativeFilePath);
            Assert.AreEqual(4, collections.NestedTypes.Count);
        }

        [Test]
        public void HelpersWithIdenticalNamesBelongToDifferentClients()
        {
            var item = InputFactory.Model("Item");
            var page = InputFactory.Model("Page", properties: [InputFactory.Property("items", InputFactory.Array(item))]);
            var firstOperation = InputFactory.Operation("Baz", responses: [InputFactory.OperationResponse(bodytype: page)]);
            var secondOperation = InputFactory.Operation("Baz", responses: [InputFactory.OperationResponse(bodytype: page)]);
            var paging = InputFactory.PagingMetadata(["items"], null, null);
            var first = InputFactory.Client("FooClient", methods: [InputFactory.PagingServiceMethod("Baz", firstOperation, pagingMetadata: paging)]);
            var second = InputFactory.Client("FooClientBar", methods: [InputFactory.PagingServiceMethod("Baz", secondOperation, pagingMetadata: paging)]);
            MockHelpers.LoadMockGenerator(inputModels: () => [item, page], clients: () => [first, second]);

            var files = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .Where(t => t.RelativeFilePath.EndsWith(".Collections.cs")).ToArray();
            Assert.AreEqual(2, files.Length);
            var firstHelper = files[0].NestedTypes.First();
            var secondHelper = files[1].NestedTypes.First();
            Assert.AreEqual(firstHelper.Name, secondHelper.Name);
            Assert.AreNotEqual(firstHelper.Type, secondHelper.Type);
            Assert.AreNotEqual(files[0].RelativeFilePath, files[1].RelativeFilePath);
        }

        [TestCase("GetItems", "GetItemsAsync", "GetItemsAsyncCollectionResult")]
        [TestCase("GetAll", "GetAll", "GetAllCollectionResult")]
        [TestCase("getItems", "get_items", "GetItemsCollectionResult")]
        public void SameClientHelperNamesAreUnique(string firstName, string secondName, string collidingName)
        {
            var item = InputFactory.Model("Item");
            var page = InputFactory.Model("Page", properties: [InputFactory.Property("items", InputFactory.Array(item))]);
            var firstOperation = InputFactory.Operation(firstName, responses: [InputFactory.OperationResponse(bodytype: page)]);
            var secondOperation = InputFactory.Operation(secondName,
                parameters: [InputFactory.QueryParameter("filter", InputPrimitiveType.String, isRequired: true)],
                responses: [InputFactory.OperationResponse(bodytype: page)]);
            var paging = InputFactory.PagingMetadata(["items"], null, null);
            var client = InputFactory.Client("TestClient", methods:
            [
                InputFactory.PagingServiceMethod(firstName, firstOperation, pagingMetadata: paging),
                InputFactory.PagingServiceMethod(secondName, secondOperation, pagingMetadata: paging)
            ]);
            MockHelpers.LoadMockGenerator(inputModels: () => [item, page], clients: () => [client]);

            var helpers = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .SelectMany(t => t.NestedTypes).OfType<CollectionResultDefinition>().ToArray();
            Assert.AreEqual(8, helpers.Length);
            Assert.AreEqual(helpers.Length, helpers.Select(t => t.Name).Distinct().Count());
            CollectionAssert.Contains(helpers.Select(t => t.Name), collidingName);
            CollectionAssert.Contains(helpers.Select(t => t.Name), $"{collidingName}2");
        }

        [Test]
        public void ExperimentalPagingDependenciesAreSuppressedInAllHelpers()
        {
            var item = InputFactory.Experimental(InputFactory.Model("Item"), "ITEM001");
            var envelope = InputFactory.Model("Page", properties: [InputFactory.Property("items", InputFactory.Array(item))]);
            var operation = InputFactory.Operation("List", responses: [InputFactory.OperationResponse(bodytype: envelope)]);
            operation.Update(experimental: new InputExperimentalDetails("API001", ["DEPENDENCY001"]));
            var serviceMethod = InputFactory.PagingServiceMethod("List", operation, pagingMetadata: InputFactory.PagingMetadata(["items"], null, null));
            var client = InputFactory.Experimental(InputFactory.Client("TestClient", methods: [serviceMethod]), "CLIENT001");
            MockHelpers.LoadMockGenerator(inputModels: () => [item, envelope], clients: () => [client]);
            var helpers = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).OfType<CollectionResultDefinition>().ToArray();

            Assert.AreEqual(4, helpers.Length);
            foreach (var helper in helpers)
            {
                Assert.IsTrue(helper.DisabledFileWarnings.All(s => s.Code.ToDisplayString() == Snippet.Literal("ITEM001").ToDisplayString()));
                var code = new TypeProviderWriter(helper).Write().Content;
                foreach (var id in new[] { "CLIENT001", "API001", "DEPENDENCY001" })
                {
                    StringAssert.Contains($"#pragma warning disable {id}", code);
                }
            }
        }

        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestCanMutateDefinition()
        {
            CreatePagingOperation(InputResponseLocation.Body);
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult");
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

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult") as CollectionResultDefinition;
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

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult") as CollectionResultDefinition;
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

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult") as CollectionResultDefinition;
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

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult") as CollectionResultDefinition;
            Assert.IsNotNull(collectionResultDefinition);

            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();

            // Verify the generated code handles URI types correctly (null check is sufficient for Uri type)
            Assert.IsTrue(file.Content.Contains("if ((nextPageUri == null))"),
                "Generated code should check for null URI");
        }

        [Test]
        public void TestCollectionResultNamesDoNotCollideWhenOperationsAreRenamed()
        {
            // Two paging operations "list" and "listAll" both get renamed to "GetAll" by CleanOperationNames.
            // Numeric suffixes disambiguate helpers using the same normalized operation name.
            var thingModel = InputFactory.Model("thing", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
            ]);
            var thingsProperty = InputFactory.Property("things", InputFactory.Array(thingModel));
            var nextProperty = InputFactory.Property("next", InputPrimitiveType.Url);
            var pageModel = InputFactory.Model("page", properties: [thingsProperty, nextProperty]);
            var response = InputFactory.OperationResponse([200], pageModel);

            var pagingMetadata = InputFactory.NextLinkPagingMetadata(["things"], ["next"], InputResponseLocation.Body);

            // "list" will be renamed to "GetAll", "listAll" will also be renamed to "GetAll"
            var listOperation = InputFactory.Operation("list", responses: [response]);
            var listAllOperation = InputFactory.Operation("listAll", responses: [response]);

            var listServiceMethod = InputFactory.PagingServiceMethod("list", listOperation, pagingMetadata: pagingMetadata);
            var listAllServiceMethod = InputFactory.PagingServiceMethod("listAll", listAllOperation, pagingMetadata: pagingMetadata);

            var client = InputFactory.Client("FooClient", methods: [listServiceMethod, listAllServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [thingModel], clients: () => [client]);

            var collectionResults = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes)
                .Where(t => t is CollectionResultDefinition)
                .ToList();

            // Should have 8 CollectionResult types (2 ops × 2 sync/async × 2 typed/untyped) and they should all have unique names
            Assert.AreEqual(8, collectionResults.Count,
                $"Expected 8 CollectionResult types but found {collectionResults.Count}");
            var collectionResultNames = collectionResults.Select(t => t.Name).ToList();
            Assert.AreEqual(collectionResultNames.Distinct().Count(), collectionResultNames.Count,
                $"CollectionResult names should be unique but found duplicates: {string.Join(", ", collectionResultNames)}");

            CollectionAssert.AreEquivalent(
                new[]
                {
                    "GetAllCollectionResult", "GetAllAsyncCollectionResult", "GetAllCollectionResultOfT", "GetAllAsyncCollectionResultOfT",
                    "GetAllCollectionResult2", "GetAllAsyncCollectionResult2", "GetAllCollectionResultOfT2", "GetAllAsyncCollectionResultOfT2"
                }, collectionResultNames);
        }

        [Test]
        public void TestCollectionResultNameUsesCurrentNameWhenNoCollision()
        {
            // A single paging operation should use the current (cleaned) name, not the original name.
            var thingModel = InputFactory.Model("thing", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
            ]);
            var thingsProperty = InputFactory.Property("things", InputFactory.Array(thingModel));
            var nextProperty = InputFactory.Property("next", InputPrimitiveType.Url);
            var pageModel = InputFactory.Model("page", properties: [thingsProperty, nextProperty]);
            var response = InputFactory.OperationResponse([200], pageModel);

            var pagingMetadata = InputFactory.NextLinkPagingMetadata(["things"], ["next"], InputResponseLocation.Body);

            // "listAll" gets renamed to "GetAll" by CleanOperationNames, no collision
            var listAllOperation = InputFactory.Operation("listAll", responses: [response]);
            var listAllServiceMethod = InputFactory.PagingServiceMethod("listAll", listAllOperation, pagingMetadata: pagingMetadata);

            var client = InputFactory.Client("FooClient", methods: [listAllServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [thingModel], clients: () => [client]);

            // When there's no collision, the cleaned name "GetAll" should be used
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetAllCollectionResult") as CollectionResultDefinition;
            Assert.IsNotNull(collectionResultDefinition,
                "CollectionResult should use cleaned name 'GetAll' when there's no collision");
        }

        [Test]
        public void TestContinuationTokenParameterNameMatchIsCaseInsensitive()
        {
            // The continuation token parameter name (e.g. "MyToken") may differ in casing from the
            // request field's parameter name (e.g. "myToken" after camel-casing). The match used to
            // associate the request field with the continuation token must be case-insensitive,
            // otherwise NextTokenField is left null and code generation throws a NullReferenceException
            // when emitting the continuation token paging logic.
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            // Note the PascalCase parameter name; the generated request field parameter will be camelCased.
            var continuationParameter = InputFactory.QueryParameter("MyToken", InputPrimitiveType.String, isRequired: true);
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

            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.SelectMany(t => t.NestedTypes).FirstOrDefault(
                t => t is CollectionResultDefinition && t.Name == "GetCatsCollectionResult") as CollectionResultDefinition;
            Assert.IsNotNull(collectionResultDefinition);

            // Code generation dereferences NextTokenField; if the case-insensitive match regresses,
            // this Write call will throw a NullReferenceException.
            var writer = new TypeProviderWriter(collectionResultDefinition!);
            var file = writer.Write();

            // The request field for the continuation token parameter should be referenced in the
            // generated code, demonstrating the field was correctly identified as the next-token field.
            Assert.IsTrue(file.Content.Contains("_myToken"),
                "Generated code should reference the continuation token request field '_myToken'.");
            Assert.IsTrue(file.Content.Contains("nextToken"),
                "Generated code should contain the continuation token paging logic.");
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
