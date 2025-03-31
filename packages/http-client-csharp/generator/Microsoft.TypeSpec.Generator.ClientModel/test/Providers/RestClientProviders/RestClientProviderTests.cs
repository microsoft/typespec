// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.RestClientProviders
{
    public class RestClientProviderTests
    {
        private static readonly InputModelType _spreadModel = InputFactory.Model(
            "spreadModel",
            usage: InputModelTypeUsage.Spread,
            properties:
            [
                InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("optionalProp1", InputPrimitiveType.String, isRequired: false),
                InputFactory.Property("optionalProp2", InputFactory.Array(InputPrimitiveType.String), isRequired: false)
            ]);

        public RestClientProviderTests()
        {
            MockHelpers.LoadMockGenerator();
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
            var specialHeaderParamCount = inputOperation.Parameters.Count(p => p.Location == InputRequestLocation.Header);
            Assert.AreEqual(inputOperation.Parameters.Count - specialHeaderParamCount + 1, parameters.Count);

            if (specialHeaderParamCount > 0)
            {
                Assert.IsFalse(parameters.Any(p =>
                    p.Name.Equals("repeatabilityFirstSent", StringComparison.OrdinalIgnoreCase) &&
                    p.Name.Equals("repeatabilityRequestId", StringComparison.OrdinalIgnoreCase)));
            }
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

            //validate _pipelineMessageClassifier201 isn't present
            Assert.IsFalse(fieldHash.ContainsKey("_pipelineMessageClassifier201"));
            //validate _pipelineMessageClassifier204 isn't present
            Assert.IsFalse(fieldHash.ContainsKey("_pipelineMessageClassifier204"));
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

            //validate _pipelineMessageClassifier201 isn't present
            Assert.IsFalse(propertyHash.ContainsKey("PipelineMessageClassifier201"));
            //validate _pipelineMessageClassifier204 isn't present
            Assert.IsFalse(propertyHash.ContainsKey("PipelineMessageClassifier204"));
        }

        [TestCaseSource(nameof(GetMethodParametersTestCases))]
        public void TestGetMethodParameters(InputOperation inputOperation)
        {
            var methodParameters = RestClientProvider.GetMethodParameters(inputOperation, RestClientProvider.MethodType.Convenience);

            Assert.IsTrue(methodParameters.Count > 0);

            if (inputOperation.Parameters.Any(p => p.Location == InputRequestLocation.Header))
            {
                // validate no special header parameters are in the method parameters
                Assert.IsFalse(methodParameters.Any(p =>
                    p.Name.Equals("repeatabilityFirstSent", StringComparison.OrdinalIgnoreCase) &&
                    p.Name.Equals("repeatabilityRequestId", StringComparison.OrdinalIgnoreCase)));
            }

            var spreadInputParameter = inputOperation.Parameters.FirstOrDefault(p => p.Kind == InputOperationParameterKind.Spread);
            if (spreadInputParameter != null)
            {
                Assert.AreEqual(_spreadModel.Properties.Count + 1, methodParameters.Count);
                // validate path parameter
                Assert.AreEqual(inputOperation.Parameters[1].Name, methodParameters[0].Name);
                // validate spread parameters
                Assert.AreEqual(_spreadModel.Properties[0].Name, methodParameters[1].Name);
                Assert.IsNull(methodParameters[1].DefaultValue);
                // validate optional parameters
                Assert.AreEqual(_spreadModel.Properties[1].Name, methodParameters[2].Name);
                Assert.AreEqual(Snippet.Default, methodParameters[2].DefaultValue);
                // validate optional parameters
                Assert.AreEqual(_spreadModel.Properties[2].Name, methodParameters[3].Name);
                Assert.AreEqual(Snippet.Default, methodParameters[3].DefaultValue);
                // the collection parameter should be using the correct input type
                Assert.IsTrue(methodParameters[3].Type.Equals(typeof(IEnumerable<string>)));
            }
        }

        [TestCase]
        public void TestGetMethodParameters_ProperOrdering()
        {
            var methodParameters = RestClientProvider.GetMethodParameters(OperationWithMixedParamOrdering, RestClientProvider.MethodType.Convenience);

            Assert.AreEqual(OperationWithMixedParamOrdering.Parameters.Count, methodParameters.Count);

            // validate ordering
            Assert.AreEqual("requiredPath", methodParameters[0].Name);
            Assert.AreEqual("requiredQuery", methodParameters[1].Name);
            Assert.AreEqual("requiredHeader", methodParameters[2].Name);
            Assert.AreEqual("body", methodParameters[3].Name);
            Assert.AreEqual("optionalQuery", methodParameters[4].Name);
            Assert.AreEqual("optionalHeader", methodParameters[5].Name);
            Assert.AreEqual("optionalContentType", methodParameters[6].Name);

            var orderedPathParams = RestClientProvider.GetMethodParameters(OperationWithOnlyPathParams, RestClientProvider.MethodType.Convenience);
            Assert.AreEqual(OperationWithOnlyPathParams.Parameters.Count, orderedPathParams.Count);
            Assert.AreEqual("c", orderedPathParams[0].Name);
            Assert.AreEqual("a", orderedPathParams[1].Name);
            Assert.AreEqual("b", orderedPathParams[2].Name);
        }

        [TestCase(true, true)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(false, false)]
        public void HeaderParameterOptionality(bool isRequired, bool isValueType)
        {
            var testOperation = InputFactory.Operation("TestOperation",
                parameters:
                [
                    InputFactory.Parameter(
                        "header",
                        isValueType ? InputFactory.Enum("header", InputPrimitiveType.String) : InputPrimitiveType.String,
                        location: InputRequestLocation.Header,
                        isRequired: isRequired),
                    InputFactory.Parameter(
                        "requiredParam",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.Header,
                        isRequired: true)
                ]);
            var client = InputFactory.Client(
                "TestClient",
                operations: [testOperation]);
            var clientProvider = new ClientProvider(client);
            var parameters = RestClientProvider.GetMethodParameters(testOperation, RestClientProvider.MethodType.Convenience);
            Assert.IsNotNull(parameters);

            if (isRequired)
            {
                Assert.AreEqual("header", parameters[0].Name);
            }
            else
            {
                Assert.AreEqual("header", parameters[1].Name);
            }
        }

        [TestCaseSource(nameof(GetSpreadParameterModelTestCases))]
        public void TestGetSpreadParameterModel(InputParameter inputParameter)
        {
            if (inputParameter.Kind == InputOperationParameterKind.Spread)
            {
                var model = RestClientProvider.GetSpreadParameterModel(inputParameter);
                Assert.AreEqual(_spreadModel, model);
            }
            else
            {
                // assert throws
                Assert.Throws<InvalidOperationException>(() => RestClientProvider.GetSpreadParameterModel(inputParameter));
            }
        }

        [Test]
        public void ValidateClientWithSpecialHeaders()
        {
            var clientProvider = new ClientProvider(SingleOpInputClient);
            var restClientProvider = new MockClientProvider(SingleOpInputClient, clientProvider);
            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateClientWithApiVersion()
        {
            var client = InputFactory.Client("TestClient",
                operations: [
                    InputFactory.Operation("OperationWithApiVersion",
                            parameters: [InputFactory.Parameter("apiVersion", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query, kind: InputOperationParameterKind.Client)])
                    ]);
            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);
            var method = restClientProvider.Methods.FirstOrDefault(m => m.Signature.Name == "CreateOperationWithApiVersionRequest");
            Assert.IsNotNull(method);
            /* verify that there is no apiVersion parameter in method signature. */
            Assert.IsNull(method?.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion")));
            var bodyStatements = method?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements);
            /* verify that it will use client _apiVersion field to append query parameter. */
            Assert.IsTrue(bodyStatements!.Statements.Any(s => s.ToDisplayString() == "uri.AppendQuery(\"apiVersion\", _apiVersion, true);\n"));
        }

        [TestCaseSource(nameof(ValidateApiVersionPathParameterTestCases))]
        public void ValidateClientWithApiVersionPathParameter(InputClient inputClient)
        {
            var clientProvider = new ClientProvider(inputClient);
            var restClientProvider = new MockClientProvider(inputClient, clientProvider);
            var method = restClientProvider.Methods.FirstOrDefault(m => m.Signature.Name == "CreateTestOperationRequest");
            Assert.IsNotNull(method);
            /* verify that there is no apiVersion parameter in method signature. */
            Assert.IsNull(method?.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion")));
            var bodyStatements = method?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements);
            /* verify that it will use client _apiVersion field to append query parameter. */
            Assert.IsTrue(bodyStatements!.Statements.Any(s => s.ToDisplayString() == "uri.AppendPath(_apiVersion, true);\n"));
        }

        [TestCaseSource(nameof(ValidateClientResponseClassifiersTestCases))]
        public void ValidateClientResponseClassifiers(InputClient inputClient)
        {
            var restClientProvider = new ClientProvider(inputClient).RestClient;
            Dictionary<string, FieldProvider> fieldHash = restClientProvider.Fields.ToDictionary(f => f.Name);
            Dictionary<string, PropertyProvider> propertyHash = restClientProvider.Properties.ToDictionary(p => p.Name);

            foreach (var inputOperation in inputClient.Operations)
            {
                List<int> expectedStatusCodes = [];
                foreach (var response in inputOperation.Responses)
                {
                    if (response.IsErrorResponse)
                        continue;
                    expectedStatusCodes.AddRange(response.StatusCodes);
                }

                Assert.IsTrue(expectedStatusCodes.Count > 0);

                var classifierNameSuffix = string.Join(string.Empty, expectedStatusCodes.OrderBy(s => s));
                Assert.IsNotEmpty(classifierNameSuffix);

                // validate fields
                Assert.IsTrue(fieldHash.ContainsKey($"_pipelineMessageClassifier{classifierNameSuffix}"));
                // validate properties
                Assert.IsTrue(propertyHash.ContainsKey($"PipelineMessageClassifier{classifierNameSuffix}"));

                // verify that the expected classifier is present in the CreateRequest method body
                var method = restClientProvider.Methods.FirstOrDefault(m => m.Signature.Name == $"CreateTestOperation{classifierNameSuffix}Request");
                Assert.IsNotNull(method);

                var bodyStatements = method?.BodyStatements as MethodBodyStatements;
                Assert.IsNotNull(bodyStatements);

                ValidateResponseClassifier(bodyStatements!, classifierNameSuffix);
            }
        }

        // This test validates that all the success status codes have their respective classifiers generated.
        [Test]
        public void ValidateAllClientResponseClassifiers()
        {
            var inputClient = InputFactory.Client(
                "TestClient",
                operations:
                [
                    OperationWith204Resp,
                    OperationWith205Resp,
                    OperationWith206Resp,
                    OperationWith200Resp,
                    OperationWith202Resp,
                    OperationWith201Resp,
                    OperationWith203Resp,
                    OperationWith200201202Resp,
                    OperationWith200201202Resp_Duplicate
                ]);
            var restClientProvider = new ClientProvider(inputClient).RestClient;
            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // validates no duplicate properties or fields are generated for the same status codes.
        [TestCaseSource(nameof(TestResponseClassifiersDuplicationTestCases))]
        public void TestResponseClassifierDuplication(InputClient inputClient)
        {
            var restClientProvider = new ClientProvider(inputClient).RestClient;
            var classifierFields = restClientProvider.Fields.Where(f => f.Name.StartsWith("_pipelineMessageClassifier")).ToList();
            var classifierProperties = restClientProvider.Properties.Where(p => p.Name.StartsWith("PipelineMessageClassifier")).ToList();

            Assert.AreEqual(4, classifierFields.Count);
            Assert.AreEqual(4, classifierProperties.Count);

            Assert.IsTrue(classifierFields.Any(f => f.Name == "_pipelineMessageClassifier200"));
            Assert.IsTrue(classifierFields.Any(f => f.Name == "_pipelineMessageClassifier201202"));
            Assert.IsTrue(classifierFields.Any(f => f.Name == "_pipelineMessageClassifier201204"));
            Assert.IsTrue(classifierFields.Any(f => f.Name == "_pipelineMessageClassifier200201204"));

            Assert.IsTrue(classifierProperties.Any(p => p.Name == "PipelineMessageClassifier200"));
            Assert.IsTrue(classifierProperties.Any(p => p.Name == "PipelineMessageClassifier201202"));
            Assert.IsTrue(classifierProperties.Any(p => p.Name == "PipelineMessageClassifier201204"));
            Assert.IsTrue(classifierProperties.Any(p => p.Name == "PipelineMessageClassifier200201204"));
        }

        [Test]
        public void ValidateGetResponseClassifiersThrowsWhenNoSuccess()
        {
            var inputOp = InputFactory.Operation(
                "TestOperation",
                responses: [InputFactory.OperationResponse([500])]);
            var inputClient = InputFactory.Client(
                "TestClient",
                operations: [inputOp]);
            Assert.IsNotNull(inputClient);

            var restClientProvider = new ClientProvider(inputClient).RestClient;
            Assert.IsNotNull(restClientProvider);

            try
            {
                var methods  = restClientProvider.Methods;
            }
            catch (InvalidOperationException e)
            {
                Assert.AreEqual($"Unexpected status codes for operation {inputOp.Name}", e.Message);
                return;
            }

            Assert.Fail("Expected Exception to be thrown.");
        }

        [Test]
        public void TestBuildCreateRequestMethodWithQueryParameters()
        {
            List<InputParameter> parameters =
            [
                InputFactory.Parameter("p1Explode", InputFactory.Array(InputPrimitiveType.String), location: InputRequestLocation.Query, isRequired: true, explode: true),
                InputFactory.Parameter("p1", InputFactory.Array(InputPrimitiveType.String), location: InputRequestLocation.Query, isRequired: true, delimiter: "|"),
                InputFactory.Parameter("p2Explode", InputFactory.Array(InputPrimitiveType.Int32), location: InputRequestLocation.Query, isRequired: true, explode: true),
                InputFactory.Parameter("p2", InputFactory.Array(InputPrimitiveType.Int32), location: InputRequestLocation.Query, isRequired: true, delimiter: " "),
                InputFactory.Parameter("optionalParam", new InputNullableType(InputPrimitiveType.String), location: InputRequestLocation.Query, isRequired: false, explode: false),
                InputFactory.Parameter("p3Explode", InputFactory.Dictionary(InputPrimitiveType.Int32), location: InputRequestLocation.Query, isRequired: true, explode: true),
                InputFactory.Parameter("p3", InputFactory.Dictionary(InputPrimitiveType.Int32), location: InputRequestLocation.Query, isRequired: true),
            ];
            var operation = InputFactory.Operation(
                "sampleOp",
                parameters: parameters);

            var client = InputFactory.Client(
                "TestClient",
                operations: [operation]);

            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private static void ValidateResponseClassifier(MethodBodyStatements bodyStatements, string parsedStatusCodes)
        {
            var classifier = $"PipelineMessageClassifier{parsedStatusCodes}";
            var classifierStatement = $"message.ResponseClassifier = {classifier};\n";

            Assert.IsTrue(bodyStatements.Statements.Any(s => s.ToDisplayString() == classifierStatement));
        }

        private readonly static InputOperation BasicOperation = InputFactory.Operation(
            "CreateMessage",
            parameters:
            [
                InputFactory.Parameter(
                    "repeatabilityFirstSent",
                    new InputDateTimeType(DateTimeKnownEncoding.Rfc7231, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String),
                    nameInRequest: "repeatability-first-sent",
                    location: InputRequestLocation.Header,
                    isRequired: false),
                InputFactory.Parameter(
                    "repeatabilityRequestId",
                    InputPrimitiveType.String,
                    nameInRequest: "repeatability-request-ID",
                    location: InputRequestLocation.Header,
                    isRequired: false),
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ]);

        private static readonly InputOperation OperationWith200Resp = InputFactory.Operation(
            "TestOperation200",
            parameters:
            [
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([200])]);
        private static readonly InputOperation OperationWith200201202Resp = InputFactory.Operation(
           "TestOperation200201202",
           parameters:
           [
               InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
           ],
           responses: [InputFactory.OperationResponse([201, 200, 202])]);
        private static readonly InputOperation OperationWith200201202Resp_Duplicate = InputFactory.Operation(
          "DuplicateTestOperation200201202",
          parameters:
          [
              InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
          ],
          responses: [InputFactory.OperationResponse([201, 200, 202])]);

        private static readonly InputOperation OperationWith201Resp = InputFactory.Operation(
            "TestOperation201",
            parameters:
            [
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([201])]);

        private static readonly InputOperation OperationWith202Resp = InputFactory.Operation(
            "TestOperation202",
            parameters:
            [
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([202])]);

        private static readonly InputOperation OperationWith203Resp = InputFactory.Operation(
            "TestOperation203",
            parameters:
            [
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([203])]);

        private static readonly InputOperation OperationWith204Resp = InputFactory.Operation(
            "TestOperation204",
            parameters:
            [
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([204])]);

        private static readonly InputOperation OperationWith205Resp = InputFactory.Operation(
            "TestOperation205",
            parameters:
            [
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([205])]);

        private static readonly InputOperation OperationWith206Resp = InputFactory.Operation(
            "TestOperation206",
            parameters:
            [
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([206])]);

        private readonly static InputOperation OperationWithSpreadParam = InputFactory.Operation(
            "CreateMessageWithSpread",
            parameters:
            [
                InputFactory.Parameter(
                    "spread",
                    _spreadModel,
                    location: InputRequestLocation.Body,
                    isRequired: true,
                    kind: InputOperationParameterKind.Spread),
                InputFactory.Parameter(
                    "p2",
                    InputPrimitiveType.Boolean,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method)
            ]);

        private static readonly InputOperation OperationWithMixedParamOrdering = InputFactory.Operation(
            "CreateMessage",
            parameters:
            [
                // require query param
                InputFactory.Parameter(
                    "requiredQuery",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Query,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                // optional query param
                InputFactory.Parameter(
                    "optionalQuery",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Query,
                    isRequired: false,
                    kind: InputOperationParameterKind.Method),
                // required path param
                InputFactory.Parameter(
                    "requiredPath",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                // required header param
                InputFactory.Parameter(
                    "requiredHeader",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                // optional header param
                InputFactory.Parameter(
                    "optionalHeader",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isRequired: false,
                    kind: InputOperationParameterKind.Method),
                // content type param
                InputFactory.Parameter(
                    "optionalContentType",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isContentType: true,
                    kind: InputOperationParameterKind.Method),
                // body param
                InputFactory.Parameter(
                    "body",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Body,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method)
            ]);

        private static readonly InputOperation OperationWithOnlyPathParams = InputFactory.Operation(
            "CreateMessage",
            parameters:
            [
                InputFactory.Parameter(
                    "c",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                InputFactory.Parameter(
                    "a",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                InputFactory.Parameter(
                    "b",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method)
            ]);

        private readonly static InputClient SingleOpInputClient = InputFactory.Client("TestClient", operations: [BasicOperation]);

        private static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases =>
        [
            new TestCaseData(BasicOperation)
        ];

        private static IEnumerable<TestCaseData> GetMethodParametersTestCases =>
        [
            new TestCaseData(OperationWithSpreadParam),
            new TestCaseData(BasicOperation),
            new TestCaseData(OperationWithMixedParamOrdering)
        ];

        private static IEnumerable<TestCaseData> ValidateClientResponseClassifiersTestCases =>
        [
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith200Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith200201202Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith201Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith202Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith203Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith204Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith205Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith206Resp])),
            new TestCaseData(InputFactory.Client("TestClient", operations: [OperationWith203Resp, OperationWith200Resp, OperationWith202Resp])),
        ];

        private static IEnumerable<TestCaseData> TestResponseClassifiersDuplicationTestCases =>
        [
            new TestCaseData(InputFactory.Client("TestClient", operations:
            [
                // _pipelineMessageClassifier200
                InputFactory.Operation("TestOperation200",
                    responses: [InputFactory.OperationResponse([200])]),
                InputFactory.Operation("TestOperation200_1",
                    responses: [InputFactory.OperationResponse([200])]),
                // _pipelineMessageClassifier201202
                InputFactory.Operation("TestOperation202201",
                    responses: [InputFactory.OperationResponse([201, 202])]),
                InputFactory.Operation("TestOperation202201_1",
                    responses: [InputFactory.OperationResponse([201, 202])]),
                InputFactory.Operation("TestOperation202_201",
                    responses: [InputFactory.OperationResponse([202]), InputFactory.OperationResponse([201])]),
                InputFactory.Operation("TestOperation202_201_1",
                    responses: [InputFactory.OperationResponse([202]), InputFactory.OperationResponse([201])]),
                // _pipelineMessageClassifier201204
                InputFactory.Operation("TestOperation204_201",
                    responses: [InputFactory.OperationResponse([204]), InputFactory.OperationResponse([201])]),
                InputFactory.Operation("TestOperation204_201_1",
                    responses: [InputFactory.OperationResponse([201]), InputFactory.OperationResponse([204])]),
                // _pipelineMessageClassifier200202204
                InputFactory.Operation("TestOperation200_201_204",
                    responses: [InputFactory.OperationResponse([204]), InputFactory.OperationResponse([201]), InputFactory.OperationResponse([200])]),
            ]))
        ];

        private static IEnumerable<TestCaseData> GetSpreadParameterModelTestCases =>
        [
            // spread param
            new TestCaseData(InputFactory.Parameter("spread", _spreadModel, location: InputRequestLocation.Body, kind: InputOperationParameterKind.Spread, isRequired: true)),
            // non spread param
            new TestCaseData(InputFactory.Parameter("p1", InputPrimitiveType.Boolean, location: InputRequestLocation.Path, isRequired: true, kind: InputOperationParameterKind.Method))

        ];

        private class MockClientProvider : RestClientProvider
        {
            public MockClientProvider(InputClient inputClient, ClientProvider clientProvider) : base(inputClient, clientProvider) { }

            protected override MethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods()];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
            protected override PropertyProvider[] BuildProperties() => [];

            protected override TypeProvider[] BuildNestedTypes() => [];
        }

        private static IEnumerable<TestCaseData> ValidateApiVersionPathParameterTestCases()
        {
            InputParameter endpointParameter = InputFactory.Parameter(
                "endpoint",
                InputPrimitiveType.String,
                location: InputRequestLocation.Uri,
                isRequired: true,
                kind: InputOperationParameterKind.Client,
                isEndpoint: true,
                isApiVersion: false);

            InputParameter stringApiVersionParameter = InputFactory.Parameter(
                "apiVersion",
                InputPrimitiveType.String,
                location: InputRequestLocation.Uri,
                isRequired: true,
                kind: InputOperationParameterKind.Client,
                isApiVersion: true);

            InputParameter enumApiVersionParameter = InputFactory.Parameter(
                "apiVersion",
                InputFactory.Enum(
                    "InputEnum",
                    InputPrimitiveType.String,
                    usage: InputModelTypeUsage.Input,
                    isExtensible: true,
                    values:
                    [
                        InputFactory.EnumMember.String("value1", "value1"),
                        InputFactory.EnumMember.String("value2", "value2")
                    ]),
                location: InputRequestLocation.Uri,
                isRequired: true,
                kind: InputOperationParameterKind.Client,
                isApiVersion: true);

            yield return new TestCaseData(
                InputFactory.Client(
                    "TestClient",
                    operations:
                    [
                        InputFactory.Operation(
                            "TestOperation",
                            uri: "{endpoint}/{apiVersion}")
                    ],
                    parameters: [
                        endpointParameter,
                        stringApiVersionParameter
                    ]));

            yield return new TestCaseData(
                InputFactory.Client(
                    "TestClient",
                    operations:
                    [
                        InputFactory.Operation(
                        "TestOperation",
                        uri: "{endpoint}/{apiVersion}")
                    ],
                    parameters: [
                        endpointParameter,
                        enumApiVersionParameter
                    ]));
        }
    }
}
