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
using Microsoft.TypeSpec.Generator.Input.Extensions;

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
        public void TestRestClientMethods(InputServiceMethod inputServiceMethod)
        {
            var restClientProvider = new ClientProvider(SingleServiceMethodInputClient).RestClient;

            var methods = restClientProvider.Methods;
            var inputOperation = inputServiceMethod.Operation;
            Assert.IsNotNull(methods, "Methods should not be null.");
            Assert.AreEqual(1, methods.Count);

            var method = restClientProvider.Methods![0];
            var signature = method.Signature;
            Assert.IsNotNull(signature);
            Assert.AreEqual($"Create{inputOperation.Name.ToIdentifierName()}Request", signature.Name);

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
            var restClient = new ClientProvider(SingleServiceMethodInputClient).RestClient;
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
            var restClient = new ClientProvider(SingleServiceMethodInputClient).RestClient;
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
        public void TestGetMethodParameters(InputServiceMethod inputServiceMethod)
        {
            var methodParameters = RestClientProvider.GetMethodParameters(inputServiceMethod, RestClientProvider.MethodType.Convenience);

            Assert.IsTrue(methodParameters.Count > 0);

            if (inputServiceMethod.Parameters.Any(p => p.Location == InputRequestLocation.Header))
            {
                // validate no special header parameters are in the method parameters
                Assert.IsFalse(methodParameters.Any(p =>
                    p.Name.Equals("repeatabilityFirstSent", StringComparison.OrdinalIgnoreCase) &&
                    p.Name.Equals("repeatabilityRequestId", StringComparison.OrdinalIgnoreCase)));
            }

            var spreadInputParameter = inputServiceMethod.Parameters.FirstOrDefault(p => p.Kind == InputParameterKind.Spread);
            if (spreadInputParameter != null)
            {
                Assert.AreEqual(_spreadModel.Properties.Count + 1, methodParameters.Count);
                // validate path parameter
                Assert.AreEqual(inputServiceMethod.Parameters[1].Name, methodParameters[0].Name);
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
            var methodParameters = RestClientProvider.GetMethodParameters(ServiceMethodWithMixedParamOrdering, RestClientProvider.MethodType.Convenience);

            Assert.AreEqual(ServiceMethodWithMixedParamOrdering.Parameters.Count, methodParameters.Count);

            // validate ordering
            Assert.AreEqual("requiredPath", methodParameters[0].Name);
            Assert.AreEqual("requiredQuery", methodParameters[1].Name);
            Assert.AreEqual("requiredHeader", methodParameters[2].Name);
            Assert.AreEqual("body", methodParameters[3].Name);
            Assert.AreEqual("optionalQuery", methodParameters[4].Name);
            Assert.AreEqual("optionalHeader", methodParameters[5].Name);
            Assert.AreEqual("optionalContentType", methodParameters[6].Name);

            var orderedPathParams = RestClientProvider.GetMethodParameters(ServiceMethodWithOnlyPathParams, RestClientProvider.MethodType.Convenience);
            Assert.AreEqual(ServiceMethodWithOnlyPathParams.Parameters.Count, orderedPathParams.Count);
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
            var testServiceMethod = InputFactory.BasicServiceMethod(
                "TestServiceMethod",
                InputFactory.Operation("TestOperation"),
                parameters:
                [
                    InputFactory.Parameter(
                        "header",
                        isValueType ? InputFactory.StringEnum("header", [("value", "value")]) : InputPrimitiveType.String,
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
                methods: [testServiceMethod]);
            var clientProvider = new ClientProvider(client);
            var parameters = RestClientProvider.GetMethodParameters(testServiceMethod, RestClientProvider.MethodType.Convenience);
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
            if (inputParameter.Kind == InputParameterKind.Spread)
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
            var clientProvider = new ClientProvider(SingleServiceMethodInputClient);
            var restClientProvider = new MockClientProvider(SingleServiceMethodInputClient, clientProvider);
            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateClientWithAcceptHeader_NoValuesDefined()
        {
            var inputServiceMethod = InputFactory.BasicServiceMethod("SingleServiceMethodInputClient",
                InputFactory.Operation("SingleServiceMethodInputClientOperation",
                    parameters:
                    [
                        InputFactory.Parameter("accept", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Header)
                    ],
                    responses:
                    [
                        InputFactory.OperationResponse([200])
                    ]));
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = new ClientProvider(inputClient);
            var restClientProvider = new MockClientProvider(inputClient, clientProvider);
            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateClientWithAcceptHeader_ValuesDefinedInResponse()
        {
            var inputServiceMethod = InputFactory.BasicServiceMethod("SingleServiceMethodInputClient",
                InputFactory.Operation("SingleServiceMethodInputClientOperation",
                    parameters:
                    [
                        InputFactory.Parameter("accept", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Header)
                    ],
                    responses:
                    [
                        InputFactory.OperationResponse([200], contentTypes: ["image/png", "image/jpeg", "image/jpeg"])
                    ]));
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = new ClientProvider(inputClient);
            var restClientProvider = new MockClientProvider(inputClient, clientProvider);
            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateClientWithAcceptHeader_ValuesDefinedAsEnum()
        {
            var acceptParameter = InputFactory.Parameter(
                "accept",
                InputFactory.StringEnum("acceptEnum", [("image/png", "image/png"), ("image/jpeg", "image/jpeg")]),
                isRequired: true,
                location: InputRequestLocation.Header);
            var inputServiceMethod = InputFactory.BasicServiceMethod("SingleServiceMethodInputClient",
                InputFactory.Operation("SingleServiceMethodInputClientOperation",
                    parameters:
                    [
                        acceptParameter
                    ],
                    responses:
                    [
                        InputFactory.OperationResponse([200])
                    ]));
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = new ClientProvider(inputClient);
            var restClientProvider = new MockClientProvider(inputClient, clientProvider);
            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateClientWithAcceptHeader_ValueDefinedAsConstant()
        {
            var acceptParameter = InputFactory.Parameter(
                "accept",
                InputFactory.Literal.String("image/png"),
                isRequired: true,
                kind: InputParameterKind.Constant,
                location: InputRequestLocation.Header);
            var inputServiceMethod = InputFactory.BasicServiceMethod("SingleServiceMethodInputClient",
                InputFactory.Operation("SingleServiceMethodInputClientOperation",
                    parameters:
                    [
                        acceptParameter
                    ],
                    responses:
                    [
                        InputFactory.OperationResponse([200])
                    ]));
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = new ClientProvider(inputClient);
            var restClientProvider = new MockClientProvider(inputClient, clientProvider);
            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateClientWithApiVersion()
        {
            var client = InputFactory.Client(
                "TestClient",
                methods: [
                    InputFactory.BasicServiceMethod(
                    "TestServiceMethod",
                    InputFactory.Operation(
                        "OperationWithApiVersion",
                        parameters: [InputFactory.Parameter("apiVersion", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query, kind: InputParameterKind.Client)]
                ))]);
            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);
            var method = restClientProvider.Methods.FirstOrDefault(m => m.Signature.Name == "CreateOperationWithApiVersionRequest");
            Assert.IsNotNull(method);
            /* verify that there is no apiVersion parameter in method signature. */
            Assert.IsNull(method?.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion")));
            var bodyStatements = method?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements);
            /* verify that it will use client _apiVersion field to append query parameter. */
            Assert.IsTrue(bodyStatements!.Any(s => s.ToDisplayString() == "uri.AppendQuery(\"apiVersion\", _apiVersion, true);\n"));
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
            Assert.IsTrue(bodyStatements!.Any(s => s.ToDisplayString() == "uri.AppendPath(_apiVersion, true);\n"));
        }

        [TestCaseSource(nameof(ValidateClientResponseClassifiersTestCases))]
        public void ValidateClientResponseClassifiers(InputClient inputClient)
        {
            var restClientProvider = new ClientProvider(inputClient).RestClient;
            Dictionary<string, FieldProvider> fieldHash = restClientProvider.Fields.ToDictionary(f => f.Name);
            Dictionary<string, PropertyProvider> propertyHash = restClientProvider.Properties.ToDictionary(p => p.Name);

            foreach (var inputMethod in inputClient.Methods)
            {
                InputOperation inputOperation = inputMethod.Operation;
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
                methods:
                [
                    InputFactory.BasicServiceMethod("204Test", OperationWith204Resp),
                    InputFactory.BasicServiceMethod("205Test", OperationWith205Resp),
                    InputFactory.BasicServiceMethod("206Test", OperationWith206Resp),
                    InputFactory.BasicServiceMethod("200Test", OperationWith200Resp),
                    InputFactory.BasicServiceMethod("202Test", OperationWith202Resp),
                    InputFactory.BasicServiceMethod("201Test", OperationWith201Resp),
                    InputFactory.BasicServiceMethod("203Test", OperationWith203Resp),
                    InputFactory.BasicServiceMethod("2000201202Test", OperationWith200201202Resp),
                    InputFactory.BasicServiceMethod("200201202DupTest", OperationWith200201202Resp_Duplicate)
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
                methods: [InputFactory.BasicServiceMethod("Test", inputOp)]);
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
                methods: [InputFactory.BasicServiceMethod("Test", operation)]);

            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestBuildCreateRequestMethodWithPathParameters()
        {
            List<InputParameter> parameters =
            [
                InputFactory.Parameter("p1", InputPrimitiveType.String, location: InputRequestLocation.Path, isRequired: true, nameInRequest: "someOtherName"),
                InputFactory.Parameter("p2", InputFactory.Array(InputPrimitiveType.Int32), location: InputRequestLocation.Path, isRequired: true, delimiter: " "),
                InputFactory.Parameter("p3", InputFactory.Dictionary(InputPrimitiveType.Int32), location: InputRequestLocation.Path, isRequired: true),
            ];
            var operation = InputFactory.Operation(
                "sampleOp",
                parameters: parameters,
                uri: "/{someOtherName}/{p2}/{p3}");

            var client = InputFactory.Client(
                "TestClient",
                methods: [InputFactory.BasicServiceMethod("Test", operation)]);

            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestBuildCreateRequestMethodWithPaging(bool acceptIsConstant)
        {
            List<InputParameter> parameters =
            [
                InputFactory.Parameter("p1", InputPrimitiveType.String, location: InputRequestLocation.Query, isRequired: true, nameInRequest: "someOtherName"),
                InputFactory.Parameter("p2", InputFactory.Array(InputPrimitiveType.Int32), location: InputRequestLocation.Query, isRequired: true, delimiter: " "),
                InputFactory.Parameter("p3", InputFactory.Dictionary(InputPrimitiveType.Int32), location: InputRequestLocation.Header, isRequired: true),
                // Accept header should be included for next link requests
                InputFactory.Parameter("accept", acceptIsConstant ? new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json") : InputPrimitiveType.String, kind: acceptIsConstant ? InputParameterKind.Constant : InputParameterKind.Method, location: InputRequestLocation.Header, isRequired: true, nameInRequest: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata("cats", "nextCat", InputResponseLocation.Header);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel)), InputFactory.Property("nextCat", InputPrimitiveType.Url)]));
            var operation = InputFactory.Operation("getCats", responses: [response], parameters: parameters);
            var inputServiceMethod = InputFactory.PagingServiceMethod(
                "getCats",
                operation,
                pagingMetadata: pagingMetadata,
                parameters: parameters);
            var client = InputFactory.Client(
                "TestClient",
                methods: [inputServiceMethod]);

            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(parameters: acceptIsConstant.ToString()), file.Content);
        }

        [Test]
        public void TestNextLinkReinjectedParametersInCreateRequestMethod()
        {
            var p1 = InputFactory.Parameter("p1", InputPrimitiveType.String, location: InputRequestLocation.Query, isRequired: true, nameInRequest: "someOtherName");
            var p2 = InputFactory.Parameter("p2", InputPrimitiveType.String, location: InputRequestLocation.Query, isRequired: true, delimiter: " ");
            var p3 = InputFactory.Parameter("p3", InputPrimitiveType.String, location: InputRequestLocation.Header, isRequired: true);
            List<InputParameter> parameters =
            [
                p1,
                p2,
                p3,
                // Accept header should be included for next link requests
                InputFactory.Parameter("accept", new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json"), kind: InputParameterKind.Constant, location: InputRequestLocation.Header, isRequired: true, nameInRequest: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata("cats", "nextCat", InputResponseLocation.Header, [p1, p2, p3]);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties: [InputFactory.Property("cats", InputFactory.Array(inputModel)), InputFactory.Property("nextCat", InputPrimitiveType.Url)]));
            var operation = InputFactory.Operation("getCats", responses: [response], parameters: parameters);
            var inputServiceMethod = InputFactory.PagingServiceMethod(
                "getCats",
                operation,
                pagingMetadata: pagingMetadata,
                parameters: parameters);
            var client = InputFactory.Client(
                "TestClient",
                methods: [inputServiceMethod]);

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

        private readonly static InputServiceMethod BasicServiceMethod = InputFactory.BasicServiceMethod(
            "CreateMessage",
            InputFactory.Operation(
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
                ]),
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

        private readonly static InputServiceMethod ServiceMethodWithSpreadParam = InputFactory.BasicServiceMethod(
            "CreateMessageWithSpread",
            InputFactory.Operation(
                "CreateMessageWithSpread",
                parameters:
                [
                    InputFactory.Parameter(
                        "spread",
                        _spreadModel,
                        location: InputRequestLocation.Body,
                        isRequired: true,
                        kind: InputParameterKind.Spread),
                    InputFactory.Parameter(
                        "p2",
                        InputPrimitiveType.Boolean,
                        location: InputRequestLocation.Path,
                        isRequired: true,
                        kind: InputParameterKind.Method)
                ]),
            parameters:
            [
                InputFactory.Parameter("p1", InputPrimitiveType.String, isRequired: true),
                InputFactory.Parameter("optionalProp1", InputPrimitiveType.String, isRequired: false),
                InputFactory.Parameter("optionalProp2", InputFactory.Array(InputPrimitiveType.String), isRequired: false)
            ]);

        private static readonly InputServiceMethod ServiceMethodWithMixedParamOrdering = InputFactory.BasicServiceMethod(
            "TestServiceMethod",
            InputFactory.Operation("TestOperation"),
            parameters:
            [
                // require query param
                InputFactory.Parameter(
                    "requiredQuery",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Query,
                    isRequired: true,
                    kind: InputParameterKind.Method),
                // optional query param
                InputFactory.Parameter(
                    "optionalQuery",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Query,
                    isRequired: false,
                    kind: InputParameterKind.Method),
                // required path param
                InputFactory.Parameter(
                    "requiredPath",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputParameterKind.Method),
                // required header param
                InputFactory.Parameter(
                    "requiredHeader",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isRequired: true,
                    kind: InputParameterKind.Method),
                // optional header param
                InputFactory.Parameter(
                    "optionalHeader",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isRequired: false,
                    kind: InputParameterKind.Method),
                // content type param
                InputFactory.Parameter(
                    "optionalContentType",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isContentType: true,
                    kind: InputParameterKind.Method),
                // body param
                InputFactory.Parameter(
                    "body",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Body,
                    isRequired: true,
                    kind: InputParameterKind.Method)
            ]);

        private static readonly InputServiceMethod ServiceMethodWithOnlyPathParams = InputFactory.BasicServiceMethod(
            "TestServiceMethod",
            InputFactory.Operation("TestOperation"),
            parameters:
            [
                InputFactory.Parameter(
                    "c",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputParameterKind.Method),
                InputFactory.Parameter(
                    "a",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputParameterKind.Method),
                InputFactory.Parameter(
                    "b",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    kind: InputParameterKind.Method)
            ]);

        private readonly static InputClient SingleServiceMethodInputClient = InputFactory.Client("TestClient", methods: [BasicServiceMethod]);

        private static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases =>
        [
            new TestCaseData(BasicServiceMethod)
        ];

        private static IEnumerable<TestCaseData> GetMethodParametersTestCases =>
        [
            new TestCaseData(ServiceMethodWithSpreadParam),
            new TestCaseData(BasicServiceMethod),
            new TestCaseData(ServiceMethodWithMixedParamOrdering)
        ];

        private static IEnumerable<TestCaseData> ValidateClientResponseClassifiersTestCases =>
        [
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith200Resp)])),
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith200201202Resp)])),
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith201Resp)])),
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith202Resp)])),
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith203Resp)])),
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith204Resp)])),
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith205Resp)])),
            new TestCaseData(InputFactory.Client("TestClient", methods :[InputFactory.BasicServiceMethod("Test", OperationWith206Resp)])),
            new TestCaseData(InputFactory.Client(
                "TestClient",
                methods:
                [
                    InputFactory.BasicServiceMethod("Test203", OperationWith203Resp),
                    InputFactory.BasicServiceMethod("Test200", OperationWith200Resp),
                    InputFactory.BasicServiceMethod("Test202", OperationWith202Resp)
                ]))
        ];

        private static IEnumerable<TestCaseData> TestResponseClassifiersDuplicationTestCases =>
        [
            new TestCaseData(InputFactory.Client("TestClient", methods:
            [
                // _pipelineMessageClassifier200
                InputFactory.BasicServiceMethod("Test200", InputFactory.Operation("TestOperation200",
                    responses: [InputFactory.OperationResponse([200])])),
                InputFactory.BasicServiceMethod("Test200_1", InputFactory.Operation("TestOperation200_1",
                    responses: [InputFactory.OperationResponse([200])])),
                // _pipelineMessageClassifier201202
                InputFactory.BasicServiceMethod("Test202201",  InputFactory.Operation("TestOperation202201",
                    responses: [InputFactory.OperationResponse([201, 202])])),
                InputFactory.BasicServiceMethod("Test202201_1", InputFactory.Operation("TestOperation202201_1",
                    responses: [InputFactory.OperationResponse([201, 202])])),
                InputFactory.BasicServiceMethod("Test202_201", InputFactory.Operation("TestOperation202_201",
                    responses: [InputFactory.OperationResponse([202]), InputFactory.OperationResponse([201])])),
                InputFactory.BasicServiceMethod("Test202_201_1", InputFactory.Operation("TestOperation202_201_1",
                    responses: [InputFactory.OperationResponse([202]), InputFactory.OperationResponse([201])])),
                // _pipelineMessageClassifier201204
                InputFactory.BasicServiceMethod("Test204_201", InputFactory.Operation("TestOperation204_201",
                    responses: [InputFactory.OperationResponse([204]), InputFactory.OperationResponse([201])])),
                InputFactory.BasicServiceMethod("Test204_201_1", InputFactory.Operation("TestOperation204_201_1",
                    responses: [InputFactory.OperationResponse([201]), InputFactory.OperationResponse([204])])),
                // _pipelineMessageClassifier200202204
                InputFactory.BasicServiceMethod("Test200_201_204", InputFactory.Operation("TestOperation200_201_204",
                    responses: [InputFactory.OperationResponse([204]), InputFactory.OperationResponse([201]), InputFactory.OperationResponse([200])])),
            ]))
        ];

        private static IEnumerable<TestCaseData> GetSpreadParameterModelTestCases =>
        [
            // spread param
            new TestCaseData(InputFactory.Parameter("spread", _spreadModel, location: InputRequestLocation.Body, kind: InputParameterKind.Spread, isRequired: true)),
            // non spread param
            new TestCaseData(InputFactory.Parameter("p1", InputPrimitiveType.Boolean, location: InputRequestLocation.Path, isRequired: true, kind: InputParameterKind.Method))

        ];

        private class MockClientProvider : RestClientProvider
        {
            public MockClientProvider(InputClient inputClient, ClientProvider clientProvider) : base(inputClient, clientProvider) { }

            protected override ScmMethodProvider[] BuildMethods()
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
                kind: InputParameterKind.Client,
                isEndpoint: true,
                isApiVersion: false);

            InputParameter stringApiVersionParameter = InputFactory.Parameter(
                "apiVersion",
                InputPrimitiveType.String,
                location: InputRequestLocation.Uri,
                isRequired: true,
                kind: InputParameterKind.Client,
                isApiVersion: true);

            InputParameter enumApiVersionParameter = InputFactory.Parameter(
                "apiVersion",
                InputFactory.StringEnum(
                    "InputEnum",
                    [
                        ("value1", "value1"),
                        ("value2", "value2")
                    ],
                    usage: InputModelTypeUsage.Input,
                    isExtensible: true),
                location: InputRequestLocation.Uri,
                isRequired: true,
                kind: InputParameterKind.Client,
                isApiVersion: true);

            yield return new TestCaseData(
                InputFactory.Client(
                    "TestClient",
                    methods:
                    [
                        InputFactory.BasicServiceMethod(
                            "TestServiceMethod",
                            InputFactory.Operation(
                                "TestOperation",
                                uri: "{endpoint}/{apiVersion}"))
                    ],
                    parameters: [endpointParameter, stringApiVersionParameter]));

            yield return new TestCaseData(
                InputFactory.Client(
                    "TestClient",
                    methods:
                    [
                        InputFactory.BasicServiceMethod(
                            "TestServiceMethod",
                             InputFactory.Operation(
                                "TestOperation",
                                uri: "{endpoint}/{apiVersion}"))
                    ],
                    parameters: [endpointParameter, enumApiVersionParameter]));
        }
    }
}
