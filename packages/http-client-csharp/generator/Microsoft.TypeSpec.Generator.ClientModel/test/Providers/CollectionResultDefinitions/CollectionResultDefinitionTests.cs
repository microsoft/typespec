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
