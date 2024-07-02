// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    internal class RestClientProviderTests
    {
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            _mockPlugin = typeof(ClientModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        public void MethodProviderSetUp(InputOperation inputOperation, TypeProvider clientProvider)
        {
            var mockTypeFactory = new Mock<ScmTypeFactory>() { };
            var mockConfiguration = new Mock<Configuration>() { };
            var mockGeneratorContext = new Mock<GeneratorContext>(mockConfiguration.Object);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { };
            mockTypeFactory.Setup(factory => factory.CreateMethodProviders(inputOperation, clientProvider)).Returns(new ScmMethodProviderCollection(inputOperation, clientProvider));
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);
        }

        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestRestClientMethods(InputOperation inputOperation)
        {
            var inputClient = new InputClient("TestClient", "TestClient description", new[] { inputOperation }, true, new List<InputParameter>(), null);
            var restClientProvider = new RestClientProvider(inputClient);
            MethodProviderSetUp(inputOperation, restClientProvider);

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
