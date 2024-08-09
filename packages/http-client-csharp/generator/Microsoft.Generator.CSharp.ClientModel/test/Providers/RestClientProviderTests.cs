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
    public class RestClientProviderTests
    {
        public RestClientProviderTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestRestClientMethods(InputOperation inputOperation)
        {
            var restClientProvider = new ClientProvider(SingleOpInputClient).RestClient;

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

        [Test]
        public void ValidateFields()
        {
            var restClient = new ClientProvider(SingleOpInputClient).RestClient;
            Dictionary<string, FieldProvider> fieldHash = restClient.Fields.ToDictionary(f => f.Name);

            //validate _pipelineMessageClassifier200
            Assert.IsTrue(fieldHash.ContainsKey("_pipelineMessageClassifier200"));
            var pipelineMessageClassifier200 = fieldHash["_pipelineMessageClassifier200"];
            Assert.AreEqual("PipelineMessageClassifier", pipelineMessageClassifier200.Type.Name);
            Assert.AreEqual("_pipelineMessageClassifier200", pipelineMessageClassifier200.Name);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Static, pipelineMessageClassifier200.Modifiers);

            //validate _pipelineMessageClassifier204
            Assert.IsTrue(fieldHash.ContainsKey("_pipelineMessageClassifier204"));
            var pipelineMessageClassifier204 = fieldHash["_pipelineMessageClassifier204"];
            Assert.AreEqual("PipelineMessageClassifier", pipelineMessageClassifier204.Type.Name);
            Assert.AreEqual("_pipelineMessageClassifier204", pipelineMessageClassifier204.Name);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Static, pipelineMessageClassifier204.Modifiers);

            //validate _pipelineMessageClassifier2xxAnd4xx
            Assert.IsTrue(fieldHash.ContainsKey("_pipelineMessageClassifier2xxAnd4xx"));
            var pipelineMessageClassifier2xxAnd4xx = fieldHash["_pipelineMessageClassifier2xxAnd4xx"];
            Assert.AreEqual("Classifier2xxAnd4xx", pipelineMessageClassifier2xxAnd4xx.Type.Name);
            Assert.AreEqual("_pipelineMessageClassifier2xxAnd4xx", pipelineMessageClassifier2xxAnd4xx.Name);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Static, pipelineMessageClassifier2xxAnd4xx.Modifiers);
        }

        [Test]
        public void ValidateProperties()
        {
            var restClient = new ClientProvider(SingleOpInputClient).RestClient;
            Dictionary<string, PropertyProvider> propertyHash = restClient.Properties.ToDictionary(p => p.Name);

            //validate _pipelineMessageClassifier200
            Assert.IsTrue(propertyHash.ContainsKey("PipelineMessageClassifier200"));
            var pipelineMessageClassifier200 = propertyHash["PipelineMessageClassifier200"];
            Assert.AreEqual("PipelineMessageClassifier", pipelineMessageClassifier200.Type.Name);
            Assert.AreEqual("PipelineMessageClassifier200", pipelineMessageClassifier200.Name);
            Assert.AreEqual(MethodSignatureModifiers.Private | MethodSignatureModifiers.Static, pipelineMessageClassifier200.Modifiers);
            Assert.IsFalse(pipelineMessageClassifier200.Body.HasSetter);

            //validate _pipelineMessageClassifier204
            Assert.IsTrue(propertyHash.ContainsKey("PipelineMessageClassifier204"));
            var pipelineMessageClassifier204 = propertyHash["PipelineMessageClassifier204"];
            Assert.AreEqual("PipelineMessageClassifier", pipelineMessageClassifier204.Type.Name);
            Assert.AreEqual("PipelineMessageClassifier204", pipelineMessageClassifier204.Name);
            Assert.AreEqual(MethodSignatureModifiers.Private | MethodSignatureModifiers.Static, pipelineMessageClassifier204.Modifiers);
            Assert.IsFalse(pipelineMessageClassifier204.Body.HasSetter);

            //validate _pipelineMessageClassifier2xxAnd4xx
            Assert.IsTrue(propertyHash.ContainsKey("PipelineMessageClassifier2xxAnd4xx"));
            var pipelineMessageClassifier2xxAnd4xx = propertyHash["PipelineMessageClassifier2xxAnd4xx"];
            Assert.AreEqual("Classifier2xxAnd4xx", pipelineMessageClassifier2xxAnd4xx.Type.Name);
            Assert.AreEqual("PipelineMessageClassifier2xxAnd4xx", pipelineMessageClassifier2xxAnd4xx.Name);
            Assert.AreEqual(MethodSignatureModifiers.Private | MethodSignatureModifiers.Static, pipelineMessageClassifier2xxAnd4xx.Modifiers);
            Assert.IsFalse(pipelineMessageClassifier2xxAnd4xx.Body.HasSetter);
        }

        private readonly static InputOperation BasicOperation = new InputOperation(
            name: "CreateMessage",
            resourceName: null,
            deprecated: null,
            description: string.Empty,
            accessibility: null,
            parameters:
            [
                new InputParameter("message", "message", "The message to create.", InputPrimitiveType.Boolean, RequestLocation.Body, null, InputOperationParameterKind.Method, true, false, false, false, false, false, false, null, null)
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
            crossLanguageDefinitionId: "TestService.CreateMessage");

        private readonly static InputClient SingleOpInputClient = new InputClient("TestClient", "TestClient description", [BasicOperation], [], null);

        private static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases =>
        [
            new TestCaseData(BasicOperation)
        ];
    }
}
