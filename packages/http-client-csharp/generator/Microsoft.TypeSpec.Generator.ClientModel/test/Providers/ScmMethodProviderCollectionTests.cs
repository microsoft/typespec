// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    internal class ScmMethodProviderCollectionTests
    {
        private static readonly InputModelType _spreadModel = InputFactory.Model(
            "spreadModel",
            usage: InputModelTypeUsage.Spread,
            properties:
            [
                InputFactory.Property("p2", InputPrimitiveType.String, isRequired: true),
            ]);

        // Validate that the default method collection consists of the expected method kind(s)
        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestDefaultCSharpMethodCollection(InputOperation inputOperation)
        {
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);

            MockHelpers.LoadMockGenerator(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)));

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            var methodCollection = new ScmMethodProviderCollection(inputOperation, client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var method = methodCollection![0];
            var signature = method.Signature;
            Assert.IsNotNull(signature);
            Assert.AreEqual(inputOperation.Name.ToCleanName(), signature.Name);

            var parameters = signature.Parameters;
            Assert.IsNotNull(parameters);
            Assert.AreEqual(inputOperation.Parameters.Count + 1, parameters.Count);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                    && m.Signature.Name == $"{inputOperation.Name.ToCleanName()}");
            Assert.IsNotNull(convenienceMethod);

            var convenienceMethodParams = convenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(convenienceMethodParams);

            var spreadInputParameter = inputOperation.Parameters.FirstOrDefault(p => p.Kind == InputOperationParameterKind.Spread);
            if (spreadInputParameter != null)
            {
                var spreadModelProperties = _spreadModel.Properties;
                // model properties + 2 (parameter and cancellation token)
                Assert.AreEqual(spreadModelProperties.Count + 2, convenienceMethodParams.Count);
                Assert.AreEqual("p1", convenienceMethodParams[0].Name);
                Assert.AreEqual(spreadModelProperties[0].Name, convenienceMethodParams[1].Name);
            }
        }

        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void ConvenienceMethodsHaveOptionalCancellationToken(InputOperation inputOperation)
        {
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);

            MockHelpers.LoadMockGenerator(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)));

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            var methodCollection = new ScmMethodProviderCollection(inputOperation, client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var asyncConvenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                    && m.Signature.Name == $"{inputOperation.Name.ToCleanName()}Async");
            Assert.IsNotNull(asyncConvenienceMethod);

            var asyncConvenienceMethodParameters = asyncConvenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(asyncConvenienceMethodParameters);

            var lastParameter = asyncConvenienceMethodParameters.Last();
            Assert.IsTrue(lastParameter.Type.Equals(typeof(CancellationToken)));
            Assert.IsFalse(lastParameter.Type.IsNullable);
            Assert.AreEqual(Snippet.Default, lastParameter.DefaultValue);

            var syncConvenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                   && m.Signature.Name == inputOperation.Name.ToCleanName());
            Assert.IsNotNull(syncConvenienceMethod);

            var syncConvenienceMethodParameters = syncConvenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(syncConvenienceMethodParameters);

            lastParameter = syncConvenienceMethodParameters.Last();
            Assert.IsTrue(lastParameter.Type.Equals(typeof(CancellationToken)));
            Assert.IsFalse(lastParameter.Type.IsNullable);
            Assert.AreEqual(Snippet.Default, lastParameter.DefaultValue);
        }

        [Test]
        public void ListMethodWithNoPaging()
        {
            MockHelpers.LoadMockGenerator();
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var modelType = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputModel);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Array(inputModel));
            var operation = InputFactory.Operation("getCats", responses: [response]);
            var inputClient = InputFactory.Client("TestClient", operations: [operation]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            // there should be no CollectionResultDefinition
            Assert.IsFalse(ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.Any(t => t is CollectionResultDefinition));

            var methodCollection = new ScmMethodProviderCollection(inputClient.Operations.First(), client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);
            var listMethod = methodCollection.FirstOrDefault(
                m => !m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "GetCats");
            Assert.IsNotNull(listMethod);
            var signature = listMethod!.Signature;

            var expectedReturnType = new CSharpType(typeof(ClientResult<>), new CSharpType(typeof(IReadOnlyList<>), modelType!));
            Assert.IsTrue(signature.ReturnType!.Equals(expectedReturnType));
        }

        [Test]
        public void ListMethodWithImplicitPaging()
        {
            var paging = new InputOperationPaging(
                ["items"],
                null,
                null);
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);

            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel))]));
            var operation = InputFactory.Operation("getCats", paging: paging, responses: [response]);
            var inputClient = InputFactory.Client("TestClient", operations: [operation]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [inputClient]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            // there should be a CollectionResultDefinition
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
               t => t is CollectionResultDefinition);
            Assert.IsNotNull(collectionResultDefinition);

            var methodCollection = new ScmMethodProviderCollection(inputClient.Operations.First(), client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var listMethod = methodCollection.FirstOrDefault(
                m => !m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "GetCats");
            Assert.IsNotNull(listMethod);

            var signature = listMethod!.Signature;
            var expectedReturnType = new CSharpType(typeof(CollectionResult));
            Assert.IsTrue(signature.ReturnType!.Equals(expectedReturnType));
        }

        [TestCase(true)]
        [TestCase(false)]
        public void RequestOptionsOptionality(bool inBody)
        {
            MockHelpers.LoadMockGenerator();
            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters:
                [
                    InputFactory.Parameter(
                        "message",
                        InputPrimitiveType.Boolean,
                        isRequired: true,
                        location: inBody ? InputRequestLocation.Body : InputRequestLocation.Query)
                ]);
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            var methodCollection = new ScmMethodProviderCollection(inputOperation, client!);
            var protocolMethod = methodCollection.FirstOrDefault(
                m => m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "TestOperation");
            Assert.IsNotNull(protocolMethod);

            var optionsParameter = protocolMethod!.Signature.Parameters.Single(p => p.Name == "options");
            if (inBody)
            {
                // When the parameter is in the body, the signatures of the protocol and convenience methods
                // will differ due to the presence of the BinaryContent parameter, which means the options parameter
                // can remain optional.
                Assert.IsNotNull(optionsParameter.DefaultValue);
            }
            else
            {
                Assert.IsNull(optionsParameter.DefaultValue);
            }
        }

        public static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Operation(
                    "CreateMessage",
                    parameters:
                    [
                        InputFactory.Parameter(
                            "message",
                            InputPrimitiveType.Boolean,
                            isRequired: true)
                    ]));

                // Operation with spread parameter
                yield return new TestCaseData(InputFactory.Operation(
                    "CreateMessage",
                    parameters:
                    [
                        InputFactory.Parameter(
                            "spread",
                            _spreadModel,
                            location: InputRequestLocation.Body,
                            isRequired: true,
                            kind: InputOperationParameterKind.Spread),
                        InputFactory.Parameter(
                            "p1",
                            InputPrimitiveType.Boolean,
                            location: InputRequestLocation.Path,
                            isRequired: true,
                            kind: InputOperationParameterKind.Method)
                    ]));
            }
        }
    }
}
