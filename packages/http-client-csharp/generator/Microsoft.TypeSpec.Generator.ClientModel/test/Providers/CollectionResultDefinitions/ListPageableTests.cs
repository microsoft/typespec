// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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
        public async Task TopParameterPreservedWhenExistsInLastContractView()
        {
            // This test verifies that when a "top" parameter exists in LastContractView,
            // it is preserved for backward compatibility instead of being converted to "maxCount"
            var topParameter = InputFactory.QueryParameter("top", InputPrimitiveType.Int32, isRequired: false, serializedName: "top");

            List<InputParameter> parameters = [topParameter];
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter("top", InputPrimitiveType.Int32, isRequired: false,
                    location: InputRequestLocation.Query, serializedName: "top"),
            ];

            var inputModel = InputFactory.Model("Item", properties:
            [
                InputFactory.Property("id", InputPrimitiveType.String, isRequired: true),
            ]);

            var pagingMetadata = new InputPagingServiceMetadata(
                ["items"],
                new InputNextLink(null, ["nextLink"], InputResponseLocation.Body, []),
                null,
                null);

            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "PagedItems",
                    properties: [
                        InputFactory.Property("items", InputFactory.Array(inputModel)),
                        InputFactory.Property("nextLink", InputPrimitiveType.Url)
                    ]));

            var operation = InputFactory.Operation("getItems", responses: [response], parameters: parameters);
            var inputServiceMethod = InputFactory.PagingServiceMethod(
                "getItems",
                operation,
                pagingMetadata: pagingMetadata,
                parameters: methodParameters);

            var client = InputFactory.Client("testClient", methods: [inputServiceMethod]);

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [client],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = generator.Object.OutputLibrary.TypeProviders.OfType<ClientProvider>().FirstOrDefault();
            Assert.IsNotNull(clientProvider);
            Assert.IsNotNull(clientProvider!.LastContractView);

            var methodParams = RestClientProvider.GetMethodParameters(inputServiceMethod, ScmMethodKind.Convenience, clientProvider!);

            var topParam = methodParams.FirstOrDefault(p =>
                string.Equals(p.Name, "top", StringComparison.Ordinal));

            Assert.IsNotNull(topParam, "Top parameter should be present in method parameters");
            Assert.AreEqual("top", topParam!.Name,
                "Parameter name should be 'top' (from LastContractView), not 'maxCount' (conversion should be prevented)");
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

        [Test]
        public async Task TopParameterPreservedViaBackCompatProvider()
        {
            // This test verifies that when a different TypeProvider (e.g., MockableResourceProvider in mgmt)
            // has "top" in its LastContractView, the GetConvenienceMethodByOperation method preserves the
            // "top" parameter name even though the ClientProvider's own LastContractView doesn't have it.
            var topParameter = InputFactory.QueryParameter("top", InputPrimitiveType.Int32, isRequired: false, serializedName: "top");

            List<InputParameter> parameters = [topParameter];
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter("top", InputPrimitiveType.Int32, isRequired: false,
                    location: InputRequestLocation.Query, serializedName: "top"),
            ];

            var inputModel = InputFactory.Model("Item", properties:
            [
                InputFactory.Property("id", InputPrimitiveType.String, isRequired: true),
            ]);

            var pagingMetadata = new InputPagingServiceMetadata(
                ["items"],
                new InputNextLink(null, ["nextLink"], InputResponseLocation.Body, []),
                null,
                null);

            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "PagedItems",
                    properties: [
                        InputFactory.Property("items", InputFactory.Array(inputModel)),
                        InputFactory.Property("nextLink", InputPrimitiveType.Url)
                    ]));

            var operation = InputFactory.Operation("getItems", responses: [response], parameters: parameters);
            var inputServiceMethod = InputFactory.PagingServiceMethod(
                "getItems",
                operation,
                pagingMetadata: pagingMetadata,
                parameters: methodParameters);

            var client = InputFactory.Client("testClient", methods: [inputServiceMethod]);

            var generator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [client],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = generator.Object.OutputLibrary.TypeProviders.OfType<ClientProvider>().FirstOrDefault();
            Assert.IsNotNull(clientProvider);

            // The ClientProvider's LastContractView should NOT have "top" (MockableTestResource has it, not TestClient)
            // Verify the convenience method has maxCount (because the ClientProvider's own backcompat didn't find "top")
            var methodsWithoutBackCompat = clientProvider!.GetMethodCollectionByOperation(operation);
            var convenienceMethodWithoutBackCompat = methodsWithoutBackCompat[^2]; // sync convenience method
            var maxCountParam = convenienceMethodWithoutBackCompat.Signature.Parameters.FirstOrDefault(p =>
                string.Equals(p.Name, "maxCount", StringComparison.Ordinal));
            Assert.IsNotNull(maxCountParam, "Without backcompat provider, parameter should be 'maxCount'");

            // Now create a backcompat provider whose LastContractView has "top"
            var backCompatProvider = new BackCompatTypeProvider("MockableTestResource", "Sample");
            Assert.IsNotNull(backCompatProvider.LastContractView, "BackCompat provider should have a LastContractView");

            // Call GetMethodCollectionByOperation with the backcompat provider — this resets and rebuilds
            var methodsWithBackCompat = clientProvider.GetMethodCollectionByOperation(operation, backCompatProvider);
            var convenienceMethodWithBackCompat = methodsWithBackCompat[^2]; // sync convenience method
            var topParam = convenienceMethodWithBackCompat.Signature.Parameters.FirstOrDefault(p =>
                string.Equals(p.Name, "top", StringComparison.Ordinal));

            Assert.IsNotNull(topParam, "With backcompat provider, parameter should be 'top' (preserved from LastContractView)");
            Assert.AreEqual("top", topParam!.Name,
                "Parameter name should be 'top' (from backcompat provider's LastContractView), not 'maxCount'");
        }

        /// <summary>
        /// A simple TypeProvider used to simulate a backcompat provider (e.g., MockableResourceProvider)
        /// whose LastContractView contains previously published parameter names.
        /// </summary>
        private class BackCompatTypeProvider : TypeProvider
        {
            private readonly string _name;
            private readonly string _namespace;

            public BackCompatTypeProvider(string name, string ns)
            {
                _name = name;
                _namespace = ns;
            }

            protected override string BuildRelativeFilePath() => $"{_name}.cs";
            protected override string BuildName() => _name;
            protected override string BuildNamespace() => _namespace;
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
