// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class CSharpMethodCollectionTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private TypeFactory _typeFactory;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private readonly string _mocksFolder = "Mocks";
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var mockParameter = new ParameterProvider("mockParam", $"mock description", typeof(bool), null);
            var mockTypeFactory = new Mock<TypeFactory>() { };
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(new CSharpType(typeof(bool)));
            mockTypeFactory.Setup(t => t.CreateCSharpParam(It.IsAny<InputParameter>())).Returns(mockParameter);
            _typeFactory = mockTypeFactory.Object;

            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var mockGeneratorContext = new Mock<GeneratorContext>(Configuration.Load(configFilePath));
            var mockPluginInstance = new Mock<CodeModelPlugin>(mockGeneratorContext.Object) { };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(_typeFactory);

            _mockPlugin?.SetValue(null, mockPluginInstance.Object);
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        // Validate that the default method collection consists of the expected method kind(s)
        [TestCaseSource(nameof(DefaultCSharpMethodCollectionTestCases))]
        public void TestDefaultCSharpMethodCollection(InputOperation inputOperation, CSharpMethodKinds expectedMethodKind)
        {

            var methodCollection = CSharpMethodCollection.DefaultCSharpMethodCollection(inputOperation);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(1, methodCollection?.Count);

            var method = methodCollection![0];
            Assert.AreEqual(expectedMethodKind, method.Kind);

            var signature = method.Signature;
            Assert.IsNotNull(signature);
            Assert.AreEqual($"Create{inputOperation.Name.ToCleanName()}Request", signature.Name);

            var parameters = signature.Parameters;
            Assert.IsNotNull(parameters);
            Assert.AreEqual(inputOperation.Parameters.Count, parameters.Count);
        }

        public static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases
        {
            get
            {
                yield return new TestCaseData(new InputOperation(
                    name: "CreateMessage",
                    resourceName: null,
                    summary: null,
                    deprecated: null,
                    description: string.Empty,
                    accessibility: null,
                    parameters: [
                        new InputParameter("message", "message", "The message to create.", new InputPrimitiveType(InputPrimitiveTypeKind.Boolean), RequestLocation.Body, null, null, InputOperationParameterKind.Method, true, false, false, false, false, false, false, null, null)
                        ],
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
                ), CSharpMethodKinds.CreateMessage);
            }
        }
    }

}
