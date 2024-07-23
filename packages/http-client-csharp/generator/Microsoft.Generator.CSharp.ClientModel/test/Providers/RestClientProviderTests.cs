// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    internal class RestClientProviderTests
    {
        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestRestClientMethods(InputOperation inputOperation)
        {
            var inputClient = new InputClient("TestClient", "TestClient description", [inputOperation], new List<InputParameter>(), null);
            var restClientProvider = new ClientProvider(inputClient).RestClient;
            MockHelpers.LoadMockPlugin(createMethods: (inputOperation, typeProvider) => new ScmMethodProviderCollection(inputOperation, restClientProvider.ClientProvider));

            var methods = restClientProvider.Methods;
            Assert.IsNotNull(methods, "Methods should not be null.");
            Assert.AreEqual(1, methods.Count);

            var method = restClientProvider.Methods![0];
            var signature = method.Signature;
            Assert.IsNotNull(signature);
            Assert.AreEqual($"Create{inputOperation.Name.ToCleanName()}Request", signature.Name);

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
                    parameters: new List<InputParameter>
                    {
                        new InputParameter("message", "message", "The message to create.", new InputPrimitiveType(InputPrimitiveTypeKind.Boolean), RequestLocation.Body, null, InputOperationParameterKind.Method, true, false, false, false, false, false, false, null, null)
                    },
                    responses: Array.Empty<OperationResponse>(),
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
                    generateConvenienceMethod: true
                ));
            }
        }
    }
}
