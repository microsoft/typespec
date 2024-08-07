// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    internal class ScmMethodProviderCollectionTests
    {
        // Validate that the default method collection consists of the expected method kind(s)
        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestDefaultCSharpMethodCollection(InputOperation inputOperation)
        {
            var inputClient = new InputClient("TestClient", "TestClient description", [inputOperation], [], null);

            MockHelpers.LoadMockPlugin(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)),
                createParameter: (inputParameter) => new ParameterProvider("mockParam", $"mock description", typeof(bool), null));

            var methodCollection = new ScmMethodProviderCollection(inputOperation, ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient));
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var method = methodCollection![0];
            var signature = method.Signature;
            Assert.IsNotNull(signature);
            Assert.AreEqual(inputOperation.Name.ToCleanName(), signature.Name);

            var parameters = signature.Parameters;
            Assert.IsNotNull(parameters);
            Assert.AreEqual(inputOperation.Parameters.Count + 1, parameters.Count);
        }

        public static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases
        {
            get
            {
                yield return new TestCaseData(new InputOperation(
                    name: "CreateMessage",
                    resourceName: null,
                    deprecated: null,
                    description: string.Empty,
                    accessibility: null,
                    parameters:
                    [
                        new InputParameter(
                            "message",
                            "message",
                            "The message to create.",
                            InputPrimitiveType.Boolean,
                            RequestLocation.Body,
                            null,
                            InputOperationParameterKind.Method,
                            true,
                            false,
                            false,
                            false,
                            false,
                            false,
                            false,
                            null,
                            null)
                    ],
                    responses: [new OperationResponse([200], null, BodyMediaType.Json, [], false, ["application/json"])],
                    httpMethod: "GET",
                    requestBodyMediaType: BodyMediaType.Json,
                    uri: "localhost",
                    path: "/api/messages",
                    externalDocsUrl: null,
                    requestMediaTypes: null,
                    bufferResponse: false,
                    longRunning: null,
                    paging: null,
                    generateProtocolMethod: true,
                    generateConvenienceMethod: true,
                    crossLanguageDefinitionId: "TestService.CreateMessage"
                ));
            }
        }
    }
}
