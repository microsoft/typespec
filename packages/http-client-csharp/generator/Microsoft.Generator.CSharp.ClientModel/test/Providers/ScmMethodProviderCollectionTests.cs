// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    internal class ScmMethodProviderCollectionTests
    {
        private static readonly InputModelType _spreadModel = new(
            "spreadModel",
            "spreadModel",
            null,
            null,
            null,
            InputModelTypeUsage.Spread,
            [new InputModelProperty("p1", "p1", "property p1", InputPrimitiveType.String, true, false, false)],
            null, [], null, null, new Dictionary<string, InputModelType>(), null, false);

        // Validate that the default method collection consists of the expected method kind(s)
        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestDefaultCSharpMethodCollection(InputOperation inputOperation)
        {
            var inputClient = new InputClient("TestClient", "TestClient description", [inputOperation], [], null);

            MockHelpers.LoadMockPlugin(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)),
                createParameterCore: (inputParameter) => new ParameterProvider("mockParam", $"mock description", typeof(bool), null));

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
                Assert.AreEqual(spreadModelProperties.Count + 1, convenienceMethodParams.Count);
                Assert.AreEqual(spreadModelProperties[0].Name, convenienceMethodParams[0].Name);
                Assert.AreEqual("mockParam", convenienceMethodParams[1].Name);
            }
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

                // Operation with spread parameter
                yield return new TestCaseData(new InputOperation(
                    name: "CreateMessage",
                    resourceName: null,
                    deprecated: null,
                    description: string.Empty,
                    accessibility: null,
                    parameters:
                    [
                        new InputParameter("spread", "spread", "Sample spread parameter.", _spreadModel, RequestLocation.Body, null, InputOperationParameterKind.Spread, true, false, false, false, false, false, false, null, null),
                        new InputParameter(
                            "p1",
                            "p1",
                            "p1",
                            InputPrimitiveType.Boolean,
                            RequestLocation.Path,
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
