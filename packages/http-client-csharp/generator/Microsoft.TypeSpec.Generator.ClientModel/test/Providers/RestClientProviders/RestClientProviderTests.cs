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

        [SetUp]
        public void Setup()
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
            var specialHeaderParamCount = inputOperation.Parameters.Count(p => p is InputHeaderParameter);
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

        [Test]
        public void Validate3xxRedirectStatusCode()
        {
            // Test that 3xx status codes (like 302 redirect) are handled correctly
            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "TestRedirect",
                InputFactory.Operation(
                    "Redirect302",
                    responses:
                    [
                        InputFactory.OperationResponse(
                            statusCodes: [302],
                            headers:
                            [
                                new InputOperationResponseHeader(
                                    "location",
                                    "location",
                                    "Location header for redirect",
                                    null,
                                    InputPrimitiveType.String)
                            ])
                    ]));

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = new ClientProvider(inputClient);
            var restClient = clientProvider.RestClient;

            Assert.IsNotNull(restClient);

            // Validate that the classifier for 302 status code exists
            Dictionary<string, PropertyProvider> propertyHash = restClient.Properties.ToDictionary(p => p.Name);
            Assert.IsTrue(propertyHash.ContainsKey("PipelineMessageClassifier302"), 
                "PipelineMessageClassifier302 should be present for 302 redirect");

            var pipelineMessageClassifier302 = propertyHash["PipelineMessageClassifier302"];
            Assert.AreEqual("PipelineMessageClassifier", pipelineMessageClassifier302.Type.Name);
            Assert.AreEqual("PipelineMessageClassifier302", pipelineMessageClassifier302.Name);
            Assert.AreEqual(MethodSignatureModifiers.Private | MethodSignatureModifiers.Static, pipelineMessageClassifier302.Modifiers);

            // Validate that fields are created correctly
            Dictionary<string, FieldProvider> fieldHash = restClient.Fields.ToDictionary(f => f.Name);
            Assert.IsTrue(fieldHash.ContainsKey("_pipelineMessageClassifier302"), 
                "_pipelineMessageClassifier302 field should be present for 302 redirect");

            var pipelineMessageClassifier302Field = fieldHash["_pipelineMessageClassifier302"];
            Assert.AreEqual("PipelineMessageClassifier", pipelineMessageClassifier302Field.Type.Name);
            Assert.AreEqual("_pipelineMessageClassifier302", pipelineMessageClassifier302Field.Name);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Static, pipelineMessageClassifier302Field.Modifiers);

            // Validate that the CreateRequest method uses the classifier
            var createRequestMethod = restClient.Methods.FirstOrDefault(m => m.Signature.Name == "CreateRedirect302Request");
            Assert.IsNotNull(createRequestMethod, "CreateRedirect302Request method should exist");

            var bodyStatements = createRequestMethod?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements, "Method body statements should not be null");

            // Verify that the classifier property is referenced in the CreateRequest method body
            ValidateResponseClassifier(bodyStatements!, "302");
        }

        [TestCaseSource(nameof(GetMethodParametersTestCases))]
        public void TestGetMethodParameters(InputServiceMethod inputServiceMethod)
        {
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);

            var methodParameters = RestClientProvider.GetMethodParameters(inputServiceMethod, ScmMethodKind.Convenience, clientProvider!);

            Assert.IsTrue(methodParameters.Count > 0);

            if (inputServiceMethod.Parameters.Any(p => p.Location == InputRequestLocation.Header))
            {
                // validate no special header parameters are in the method parameters
                Assert.IsFalse(methodParameters.Any(p =>
                    p.Name.Equals("repeatabilityFirstSent", StringComparison.OrdinalIgnoreCase) &&
                    p.Name.Equals("repeatabilityRequestId", StringComparison.OrdinalIgnoreCase)));
            }

            var spreadInputParameter = inputServiceMethod.Parameters.FirstOrDefault(p => p.Scope == InputParameterScope.Spread);
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
            var inputClient = InputFactory.Client("TestClient", methods: [ServiceMethodWithMixedParamOrdering]);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);

            var methodParameters = RestClientProvider.GetMethodParameters(ServiceMethodWithMixedParamOrdering, ScmMethodKind.Convenience, clientProvider!);

            Assert.AreEqual(ServiceMethodWithMixedParamOrdering.Parameters.Count, methodParameters.Count);

            // validate ordering
            Assert.AreEqual("requiredPath", methodParameters[0].Name);
            Assert.AreEqual("requiredQuery", methodParameters[1].Name);
            Assert.AreEqual("requiredHeader", methodParameters[2].Name);
            Assert.AreEqual("body", methodParameters[3].Name);
            Assert.AreEqual("optionalQuery", methodParameters[4].Name);
            Assert.AreEqual("optionalHeader", methodParameters[5].Name);
            Assert.AreEqual("optionalContentType", methodParameters[6].Name);

            inputClient = InputFactory.Client("TestClient", methods: [ServiceMethodWithOnlyPathParams]);
            clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);

            var orderedPathParams = RestClientProvider.GetMethodParameters(ServiceMethodWithOnlyPathParams, ScmMethodKind.Convenience, clientProvider!);
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
                    InputFactory.MethodParameter(
                        "header",
                        isValueType ? InputFactory.StringEnum("header", [("value", "value")]) : InputPrimitiveType.String,
                        location: InputRequestLocation.Header,
                        isRequired: isRequired),
                    InputFactory.MethodParameter(
                        "requiredParam",
                        InputPrimitiveType.String,
                        location: InputRequestLocation.Header,
                        isRequired: true)
                ]);
            var client = InputFactory.Client(
                "TestClient",
                methods: [testServiceMethod]);
            var clientProvider = new ClientProvider(client);
            Assert.IsNotNull(clientProvider);

            var parameters = RestClientProvider.GetMethodParameters(testServiceMethod, ScmMethodKind.Convenience, clientProvider!);
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
            if (inputParameter.Scope == InputParameterScope.Spread)
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
                        InputFactory.HeaderParameter("accept", InputPrimitiveType.String, isRequired: true)
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
                        InputFactory.HeaderParameter("accept", InputPrimitiveType.String, isRequired: true)
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
            var acceptParameter = InputFactory.HeaderParameter(
                "accept",
                InputFactory.StringEnum("acceptEnum", [("image/png", "image/png"), ("image/jpeg", "image/jpeg")]),
                isRequired: true);
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
            var acceptParameter = InputFactory.HeaderParameter(
                "accept",
                InputFactory.Literal.String("image/png"),
                isRequired: true,
                scope: InputParameterScope.Constant);
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
                        parameters: [InputFactory.QueryParameter("apiVersion", InputPrimitiveType.String, isRequired: true, scope: InputParameterScope.Client)]
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
            List<string> stringEnum = ["bar"];
            List<int> intEnum = [1, 2, 3];
            List<float> floatEnum = [1.1f, 2.2f, 3.3f];
            List<double> doubleEnum = [1.1, 2.2, 3.3];
            var stringEnumValues = stringEnum.Select(a => (a, a));
            var intEnumValues = intEnum.Select(a => (a.ToString(), a));
            var floatEnumValues = floatEnum.Select(a => (a.ToString(), a));
            var doubleEnumValues = doubleEnum.Select(a => (a.ToString(), a));
            var inputStringEnum = InputFactory.StringEnum(
                "foo",
                stringEnumValues);
            var inputIntEnum = InputFactory.Int32Enum(
                "intFoo",
                intEnumValues);
            var inputFloatEnum = InputFactory.Float32Enum(
                "floatFoo",
                floatEnumValues);
            var inputDoubleEnum = InputFactory.Float64Enum(
                "doubleFoo",
                doubleEnumValues);
            List<InputParameter> parameters =
            [
                InputFactory.QueryParameter("p1Explode", InputFactory.Array(InputPrimitiveType.String), isRequired: true, explode: true),
                InputFactory.QueryParameter("p1", InputFactory.Array(InputPrimitiveType.String), isRequired: true, delimiter: "|"),
                InputFactory.QueryParameter("p2Explode", InputFactory.Array(InputPrimitiveType.Int32), isRequired: true, explode: true),
                InputFactory.QueryParameter("p2", InputFactory.Array(InputPrimitiveType.Int32), isRequired: true, delimiter: " "),
                InputFactory.QueryParameter("optionalParam", new InputNullableType(InputPrimitiveType.String), isRequired: false, explode: false),
                InputFactory.QueryParameter("p3Explode", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true, explode: true),
                InputFactory.QueryParameter("p3", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true),
                InputFactory.QueryParameter("p4Explode", InputFactory.Array(inputStringEnum), isRequired: true, explode: true),
                InputFactory.QueryParameter("p5Explode", InputFactory.Array(inputIntEnum), isRequired: true, explode: true),
                InputFactory.QueryParameter("p6Explode", InputFactory.Dictionary(inputStringEnum), isRequired: true, explode: true),
                InputFactory.QueryParameter("p7Explode", InputFactory.Dictionary(inputIntEnum), isRequired: true, explode: true),
                InputFactory.QueryParameter("p8Explode", InputFactory.Array(inputFloatEnum), isRequired: true, explode: true),
                InputFactory.QueryParameter("p9Explode", InputFactory.Array(inputDoubleEnum), isRequired: true, explode: true),
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
                InputFactory.PathParameter("p1", InputPrimitiveType.String, isRequired: true, serializedName: "someOtherName"),
                InputFactory.PathParameter("p2", InputFactory.Array(InputPrimitiveType.Int32), isRequired: true),
                InputFactory.PathParameter("p3", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true),
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
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter("p1", InputPrimitiveType.String, isRequired: true, serializedName: "someOtherName", location: InputRequestLocation.Query),
                InputFactory.MethodParameter("p2", InputFactory.Array(InputPrimitiveType.Int32), isRequired: true, location: InputRequestLocation.Query),
                InputFactory.MethodParameter("p3", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true, location: InputRequestLocation.Header),
                // Accept header should be included for next link requests
                InputFactory.MethodParameter("accept", acceptIsConstant ? new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json") : InputPrimitiveType.String, scope: acceptIsConstant ? InputParameterScope.Constant : InputParameterScope.Method, isRequired: true, location: InputRequestLocation.Header, serializedName: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            List<InputParameter> parameters =
            [
                InputFactory.QueryParameter("p1", InputPrimitiveType.String, isRequired: true, serializedName: "someOtherName"),
                InputFactory.QueryParameter("p2", InputFactory.Array(InputPrimitiveType.Int32), isRequired: true, delimiter: " "),
                InputFactory.HeaderParameter("p3", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true),
                // Accept header should be included for next link requests
                InputFactory.HeaderParameter("accept", acceptIsConstant ? new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json") : InputPrimitiveType.String, scope: acceptIsConstant ? InputParameterScope.Constant : InputParameterScope.Method, isRequired: true, serializedName: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata(["cats"], ["nextCat"], InputResponseLocation.Header);
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
                parameters: methodParameters);
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
            var p1 = InputFactory.QueryParameter("p1", InputPrimitiveType.String, isRequired: true, serializedName: "someOtherName");
            var p2 = InputFactory.QueryParameter("p2", InputPrimitiveType.String, isRequired: true, delimiter: " ");
            var p3 = InputFactory.HeaderParameter("p3", InputPrimitiveType.String, isRequired: true);
            List<InputParameter> parameters =
            [
                p1,
                p2,
                p3,
                // Accept header should be included for next link requests
                InputFactory.HeaderParameter("accept", new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json"), scope: InputParameterScope.Constant, isRequired: true, serializedName: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter("p1", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query, serializedName: "someOtherName"),
                InputFactory.MethodParameter("p2", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query),
                InputFactory.MethodParameter("p3", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Header),
                // Accept header should be included for next link requests
                InputFactory.MethodParameter("accept", new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json"), scope: InputParameterScope.Constant, isRequired: true, location: InputRequestLocation.Header, serializedName: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata(["cats"], ["nextCat"], InputResponseLocation.Header, [p1, p2, p3]);
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
                parameters: methodParameters);
            var client = InputFactory.Client(
                "TestClient",
                methods: [inputServiceMethod]);

            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestPageSizeParameterReinjectedInCreateNextRequestMethod()
        {
            var p1 = InputFactory.QueryParameter("p1", InputPrimitiveType.String, isRequired: true);
            var p2 = InputFactory.QueryParameter("p2", InputPrimitiveType.String, isRequired: true);
            var h1 = InputFactory.HeaderParameter("h1", InputPrimitiveType.String, isRequired: true);
            var maxPageSize = InputFactory.QueryParameter("maxPageSize", InputPrimitiveType.Int32, isRequired: false);
            List<InputParameter> parameters =
            [
                p1,
                p2,
                h1,
                maxPageSize,
                // Accept header should be included for next link requests
                InputFactory.HeaderParameter("accept", new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json"), scope: InputParameterScope.Constant, isRequired: true, serializedName: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter("p1", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query),
                InputFactory.MethodParameter("p2", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query),
                InputFactory.MethodParameter("h1", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Header),
                InputFactory.MethodParameter("maxPageSize", InputPrimitiveType.Int32, isRequired: false, location: InputRequestLocation.Query),
                // Accept header should be included for next link requests
                InputFactory.MethodParameter("accept", new InputLiteralType("Accept", "ns", InputPrimitiveType.String, "application/json"), scope: InputParameterScope.Constant, isRequired: true, location: InputRequestLocation.Header, serializedName: "Accept", defaultValue: new InputConstant("application/json", InputPrimitiveType.String)),
            ];
            var inputModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = new InputPagingServiceMetadata(
                ["cats"], 
                new InputNextLink(null, ["nextCat"], InputResponseLocation.Header, [p1]), 
                null,
                ["maxPageSize"]);
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
                parameters: methodParameters);
            var client = InputFactory.Client(
                "TestClient",
                methods: [inputServiceMethod]);

            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestReadOnlyParameters_FilteredFromCreateRequest()
        {
            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "TestServiceMethod",
                InputFactory.Operation(
                    "TestOperation",
                    parameters:
                    [
                        // Read-only parameters are already filtered out from operation parameters
                        InputFactory.QueryParameter("normalParam", InputPrimitiveType.String, isRequired: true),
                        InputFactory.HeaderParameter("normalHeader", InputPrimitiveType.Int32, isRequired: true)
                    ]),
                parameters:
                [
                    InputFactory.MethodParameter("readOnlyParam", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query, isReadOnly: true),
                    InputFactory.MethodParameter("normalParam", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query),
                    InputFactory.MethodParameter("readOnlyHeader", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Header, isReadOnly: true),
                    InputFactory.MethodParameter("normalHeader", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Header)
                ]);

            var client = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var restClientProvider = new ClientProvider(client).RestClient;
            var method = restClientProvider.Methods.FirstOrDefault(m => m.Signature.Name.Contains("CreateTestOperationRequest"));

            Assert.IsNotNull(method);
            var parameters = method!.Signature.Parameters;

            // Verify read-only parameters are filtered out
            Assert.IsFalse(parameters.Any(p => p.Name == "readOnlyParam"));
            Assert.IsFalse(parameters.Any(p => p.Name == "readOnlyHeader"));

            // Verify normal parameters are included
            Assert.IsTrue(parameters.Any(p => p.Name == "normalParam"));
            Assert.IsTrue(parameters.Any(p => p.Name == "normalHeader"));
        }

        [Test]
        public void TestReadOnlyParameters_FilteredFromProtocolMethod()
        {
            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "TestServiceMethod",
                InputFactory.Operation(
                    "TestOperation",
                    parameters:
                    [
                        // Read-only parameters are already filtered out from operation parameters
                        InputFactory.PathParameter("normalPath", InputPrimitiveType.String, isRequired: true),
                        InputFactory.BodyParameter("normalBody", InputPrimitiveType.String, isRequired: true)
                    ]),
                parameters:
                [
                    InputFactory.MethodParameter("readOnlyPath", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Path, isReadOnly: true),
                    InputFactory.MethodParameter("normalPath", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Path),
                    InputFactory.MethodParameter("readOnlyBody", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Body, isReadOnly: true),
                    InputFactory.MethodParameter("normalBody", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Body)
                ]);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);

            var methodParameters = RestClientProvider.GetMethodParameters(inputServiceMethod, ScmMethodKind.Protocol, clientProvider!);

            // Verify read-only parameters are filtered out
            Assert.IsFalse(methodParameters.Any(p => p.Name == "readOnlyPath"));
            Assert.IsFalse(methodParameters.Any(p => p.Name == "readOnlyBody"));

            // Verify normal parameters are included
            Assert.IsTrue(methodParameters.Any(p => p.Name == "normalPath"));
            Assert.IsTrue(methodParameters.Any(p => p.Name == "content"));
        }

        [Test]
        public void TestReadOnlyParameters_FilteredFromConvenienceMethod()
        {
            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "TestServiceMethod",
                InputFactory.Operation(
                    "TestOperation",
                    parameters:
                    [
                        // Read-only parameters are already filtered out from operation parameters
                        InputFactory.QueryParameter("normalQuery", InputPrimitiveType.String, isRequired: true),
                        InputFactory.HeaderParameter("normalHeader", InputPrimitiveType.Boolean, isRequired: false)
                    ]),
                parameters:
                [
                    InputFactory.MethodParameter("readOnlyQuery", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query, isReadOnly: true),
                    InputFactory.MethodParameter("normalQuery", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query),
                    InputFactory.MethodParameter("readOnlyHeader", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Header, isReadOnly: true),
                    InputFactory.MethodParameter("normalHeader", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Header)
                ]);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);

            var methodParameters = RestClientProvider.GetMethodParameters(inputServiceMethod, ScmMethodKind.Convenience, clientProvider!);

            // Verify read-only parameters are filtered out
            Assert.IsFalse(methodParameters.Any(p => p.Name == "readOnlyQuery"));
            Assert.IsFalse(methodParameters.Any(p => p.Name == "readOnlyHeader"));

            // Verify normal parameters are included
            Assert.IsTrue(methodParameters.Any(p => p.Name == "normalQuery"));
            Assert.IsTrue(methodParameters.Any(p => p.Name == "normalHeader"));
        }

        [Test]
        public void TestReadOnlyParameters_WithMixedParameterTypes()
        {
            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "TestServiceMethod",

                InputFactory.Operation(
                    "TestOperation",
                    parameters:
                    [
                        InputFactory.PathParameter("normalPath", InputPrimitiveType.String, isRequired: true),
                        InputFactory.QueryParameter("normalQuery", InputPrimitiveType.String, isRequired: true),
                        InputFactory.HeaderParameter("normalHeader", InputPrimitiveType.String, isRequired: false),
                        InputFactory.BodyParameter("normalBody", InputPrimitiveType.String, isRequired: true)
                    ]),
                parameters:
                [
                    InputFactory.MethodParameter("normalPath", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Path),
                    InputFactory.MethodParameter("readOnlyQuery", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Query, isReadOnly: true),
                    InputFactory.MethodParameter("normalQuery", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Query),
                    InputFactory.MethodParameter("readOnlyHeader", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Header, isReadOnly: true),
                    InputFactory.MethodParameter("normalHeader", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Header),
                    InputFactory.MethodParameter("normalBody", InputPrimitiveType.Boolean, isRequired: false, location: InputRequestLocation.Body)
                ]);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(clientProvider);

            var methodParameters = RestClientProvider.GetMethodParameters(inputServiceMethod, ScmMethodKind.Convenience, clientProvider!);

            Assert.AreEqual(4, methodParameters.Count); // Only non-readonly parameters
            Assert.IsTrue(methodParameters.Any(p => p.Name == "normalPath"));
            Assert.IsTrue(methodParameters.Any(p => p.Name == "normalQuery"));
            Assert.IsTrue(methodParameters.Any(p => p.Name == "normalHeader"));
            Assert.IsTrue(methodParameters.Any(p => p.Name == "normalBody"));
            Assert.IsFalse(methodParameters.Any(p => p.Name == "readOnlyQuery"));
            Assert.IsFalse(methodParameters.Any(p => p.Name == "readOnlyHeader"));
        }

        [Test]
        public void MultiServiceCombinedClient_GeneratesExpectedRestClient()
        {
            // Setup multiservice client with multiple API version enums and operations
            List<string> serviceAVersions = ["1.0", "2.0"];
            List<string> serviceBVersions = ["3.0", "4.0"];

            var serviceAEnumValues = serviceAVersions.Select(a => (a, a));
            var serviceBEnumValues = serviceBVersions.Select(a => (a, a));

            var serviceAEnum = InputFactory.StringEnum(
                "ServiceVersionA",
                serviceAEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.ServiceA");
            var serviceBEnum = InputFactory.StringEnum(
                "ServiceVersionB",
                serviceBEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.ServiceB");

            InputParameter apiVersionParameter = InputFactory.QueryParameter(
                "apiVersion",
                InputPrimitiveType.String,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: true);

            // Create operations with namespace set to each service
            var serviceAOperation = InputFactory.Operation(
                "ServiceAOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.ServiceA");

            var serviceBOperation = InputFactory.Operation(
                "ServiceBOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.ServiceB");

            var client = InputFactory.Client(
                "TestClient",
                methods:
                [
                    InputFactory.BasicServiceMethod("ServiceAMethod", serviceAOperation),
                    InputFactory.BasicServiceMethod("ServiceBMethod", serviceBOperation)
                ],
                parameters: [apiVersionParameter],
                isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. serviceAVersions, .. serviceBVersions],
                clients: () => [client],
                inputEnums: () => [serviceAEnum, serviceBEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            var restClient = clientProvider!.RestClient;
            Assert.IsNotNull(restClient);

            var writer = new TypeProviderWriter(restClient);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultiServiceCombinedClient_WithThreeServices_GeneratesExpectedRestClient()
        {
            // Setup multiservice combined client with three different services (KeyVault, Storage, Compute)
            List<string> keyVaultVersions = ["7.4", "7.5"];
            List<string> storageVersions = ["2023-01-01", "2024-01-01"];
            List<string> computeVersions = ["2023-07-01", "2024-03-01", "2024-07-01"];

            var keyVaultEnumValues = keyVaultVersions.Select(a => (a, a));
            var storageEnumValues = storageVersions.Select(a => (a, a));
            var computeEnumValues = computeVersions.Select(a => (a, a));

            var keyVaultEnum = InputFactory.StringEnum(
                "KeyVaultVersion",
                keyVaultEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.KeyVault");
            var storageEnum = InputFactory.StringEnum(
                "StorageVersion",
                storageEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.Storage");
            var computeEnum = InputFactory.StringEnum(
                "ComputeVersion",
                computeEnumValues,
                usage: InputModelTypeUsage.ApiVersionEnum,
                clientNamespace: "Sample.Compute");

            InputParameter apiVersionParameter = InputFactory.QueryParameter(
                "apiVersion",
                InputPrimitiveType.String,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: true);

            // Create operations with namespace set to each service
            var keyVaultOperation = InputFactory.Operation(
                "KeyVaultOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.KeyVault");

            var storageOperation = InputFactory.Operation(
                "StorageOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.Storage");

            var computeOperation = InputFactory.Operation(
                "ComputeOperation",
                parameters: [apiVersionParameter],
                ns: "Sample.Compute");

            var client = InputFactory.Client(
                "TestClient",
                methods:
                [
                    InputFactory.BasicServiceMethod("KeyVaultMethod", keyVaultOperation),
                    InputFactory.BasicServiceMethod("StorageMethod", storageOperation),
                    InputFactory.BasicServiceMethod("ComputeMethod", computeOperation)
                ],
                parameters: [apiVersionParameter],
                isMultiServiceClient: true);

            MockHelpers.LoadMockGenerator(
                apiVersions: () => [.. keyVaultVersions, .. storageVersions, .. computeVersions],
                clients: () => [client],
                inputEnums: () => [keyVaultEnum, storageEnum, computeEnum]);

            var clientProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
            Assert.IsNotNull(clientProvider);

            var restClient = clientProvider!.RestClient;
            Assert.IsNotNull(restClient);

            var writer = new TypeProviderWriter(restClient);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }


        private static void ValidateResponseClassifier(MethodBodyStatements bodyStatements, string parsedStatusCodes)
        {
            var classifier = $"PipelineMessageClassifier{parsedStatusCodes}";

            Assert.IsTrue(bodyStatements.Statements.Any(s => s.ToDisplayString().Contains(classifier)));
        }

        private readonly static InputServiceMethod BasicServiceMethod = InputFactory.BasicServiceMethod(
            "CreateMessage",
            InputFactory.Operation(
                "CreateMessage",
                parameters:
                [
                    InputFactory.HeaderParameter(
                        "repeatabilityFirstSent",
                        new InputDateTimeType(DateTimeKnownEncoding.Rfc7231, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String),
                        serializedName: "repeatability-first-sent",
                        isRequired: false),
                    InputFactory.HeaderParameter(
                        "repeatabilityRequestId",
                        InputPrimitiveType.String,
                        serializedName: "repeatability-request-ID",
                        isRequired: false),
                    InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
                ]),
            parameters:
            [
                InputFactory.MethodParameter(
                    "repeatabilityFirstSent",
                    new InputDateTimeType(DateTimeKnownEncoding.Rfc7231, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String),
                    serializedName: "repeatability-first-sent",
                    location: InputRequestLocation.Header,
                    isRequired: false),
                InputFactory.MethodParameter(
                    "repeatabilityRequestId",
                    InputPrimitiveType.String,
                    serializedName: "repeatability-request-ID",
                    location: InputRequestLocation.Header,
                    isRequired: false),
                InputFactory.MethodParameter("message", InputPrimitiveType.Boolean, isRequired: true, location: InputRequestLocation.Body)
            ]);

        private static readonly InputOperation OperationWith200Resp = InputFactory.Operation(
            "TestOperation200",
            parameters:
            [
                InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([200])]);
        private static readonly InputOperation OperationWith200201202Resp = InputFactory.Operation(
           "TestOperation200201202",
           parameters:
           [
               InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
           ],
           responses: [InputFactory.OperationResponse([201, 200, 202])]);
        private static readonly InputOperation OperationWith200201202Resp_Duplicate = InputFactory.Operation(
          "DuplicateTestOperation200201202",
          parameters:
          [
              InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
          ],
          responses: [InputFactory.OperationResponse([201, 200, 202])]);

        private static readonly InputOperation OperationWith201Resp = InputFactory.Operation(
            "TestOperation201",
            parameters:
            [
                InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([201])]);

        private static readonly InputOperation OperationWith202Resp = InputFactory.Operation(
            "TestOperation202",
            parameters:
            [
                InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([202])]);

        private static readonly InputOperation OperationWith203Resp = InputFactory.Operation(
            "TestOperation203",
            parameters:
            [
                InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([203])]);

        private static readonly InputOperation OperationWith204Resp = InputFactory.Operation(
            "TestOperation204",
            parameters:
            [
                InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([204])]);

        private static readonly InputOperation OperationWith205Resp = InputFactory.Operation(
            "TestOperation205",
            parameters:
            [
                InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([205])]);

        private static readonly InputOperation OperationWith206Resp = InputFactory.Operation(
            "TestOperation206",
            parameters:
            [
                InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ],
            responses: [InputFactory.OperationResponse([206])]);

        private readonly static InputServiceMethod ServiceMethodWithSpreadParam = InputFactory.BasicServiceMethod(
            "CreateMessageWithSpread",
            InputFactory.Operation(
                "CreateMessageWithSpread",
                parameters:
                [
                    InputFactory.BodyParameter(
                        "spread",
                        _spreadModel,
                        isRequired: true,
                        scope: InputParameterScope.Spread),
                    InputFactory.PathParameter(
                        "p2",
                        InputPrimitiveType.Boolean,
                        isRequired: true,
                        scope: InputParameterScope.Method)
                ]),
            parameters:
            [
                InputFactory.MethodParameter("p1", InputPrimitiveType.String, isRequired: true),
                InputFactory.MethodParameter("optionalProp1", InputPrimitiveType.String, isRequired: false),
                InputFactory.MethodParameter("optionalProp2", InputFactory.Array(InputPrimitiveType.String), isRequired: false)
            ]);

        private static readonly InputServiceMethod ServiceMethodWithMixedParamOrdering = InputFactory.BasicServiceMethod(
            "TestServiceMethod",
            InputFactory.Operation("TestOperation"),
            parameters:
            [
                // require query param
                InputFactory.MethodParameter(
                    "requiredQuery",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Query,
                    isRequired: true,
                    scope: InputParameterScope.Method),
                // optional query param
                InputFactory.MethodParameter(
                    "optionalQuery",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Query,
                    isRequired: false,
                    scope: InputParameterScope.Method),
                // required path param
                InputFactory.MethodParameter(
                    "requiredPath",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    scope: InputParameterScope.Method),
                // required header param
                InputFactory.MethodParameter(
                    "requiredHeader",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isRequired: true,
                    scope: InputParameterScope.Method),
                // optional header param
                InputFactory.MethodParameter(
                    "optionalHeader",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    isRequired: false,
                    scope: InputParameterScope.Method),
                // content type param
                InputFactory.MethodParameter(
                    "optionalContentType",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Header,
                    scope: InputParameterScope.Method),
                // body param
                InputFactory.MethodParameter(
                    "body",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Body,
                    isRequired: true,
                    scope: InputParameterScope.Method)
            ]);

        private static readonly InputServiceMethod ServiceMethodWithOnlyPathParams = InputFactory.BasicServiceMethod(
            "TestServiceMethod",
            InputFactory.Operation("TestOperation"),
            parameters:
            [
                InputFactory.MethodParameter(
                    "c",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    scope: InputParameterScope.Method),
                InputFactory.MethodParameter(
                    "a",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    scope: InputParameterScope.Method),
                InputFactory.MethodParameter(
                    "b",
                    InputPrimitiveType.String,
                    location: InputRequestLocation.Path,
                    isRequired: true,
                    scope: InputParameterScope.Method)
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
            new TestCaseData(InputFactory.BodyParameter("spread", _spreadModel, scope: InputParameterScope.Spread, isRequired: true)),
            // non spread param
            new TestCaseData(InputFactory.BodyParameter("p1", InputPrimitiveType.Boolean, isRequired : true, scope : InputParameterScope.Method))

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
            InputMethodParameter endpointParameter = InputFactory.MethodParameter(
                "endpoint",
                InputPrimitiveType.String,
                location: InputRequestLocation.Uri,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: false);

            InputMethodParameter stringApiVersionParameter = InputFactory.MethodParameter(
                "apiVersion",
                InputPrimitiveType.String,
                location: InputRequestLocation.Uri,
                isRequired: true,
                scope: InputParameterScope.Client,
                isApiVersion: true);

            InputMethodParameter enumApiVersionParameter = InputFactory.MethodParameter(
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
                scope: InputParameterScope.Client,
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

        [Test]
        public void TestApiVersionParameterReinjectedInCreateNextRequestMethod()
        {
            // Create API version parameter marked with IsApiVersion = true
            var apiVersionParam = InputFactory.QueryParameter("apiVersion", InputPrimitiveType.String, 
                isRequired: true, serializedName: "api-version", isApiVersion: true);
            var pageSizeParam = InputFactory.QueryParameter("maxpagesize", InputPrimitiveType.Int32, 
                isRequired: false, serializedName: "maxpagesize");
            
            List<InputParameter> parameters =
            [
                apiVersionParam,
                pageSizeParam,
            ];
            
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter("apiVersion", InputPrimitiveType.String, isRequired: true, 
                    location: InputRequestLocation.Query, serializedName: "api-version"),
                InputFactory.MethodParameter("maxpagesize", InputPrimitiveType.Int32, isRequired: false, 
                    location: InputRequestLocation.Query, serializedName: "maxpagesize"),
            ];
            
            var inputModel = InputFactory.Model("Item", properties:
            [
                InputFactory.Property("id", InputPrimitiveType.String, isRequired: true),
            ]);
            
            var pagingMetadata = InputFactory.NextLinkPagingMetadata(["value"], ["nextLink"], 
                InputResponseLocation.Body, reinjectedParameters: []);
            
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "PagedItems",
                    properties: [
                        InputFactory.Property("value", InputFactory.Array(inputModel)), 
                        InputFactory.Property("nextLink", InputPrimitiveType.Url)
                    ]));
            
            var operation = InputFactory.Operation("listItems", responses: [response], parameters: parameters);
            var inputServiceMethod = InputFactory.PagingServiceMethod(
                "listItems",
                operation,
                pagingMetadata: pagingMetadata,
                parameters: methodParameters);
            
            var client = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var clientProvider = new ClientProvider(client);
            var restClientProvider = new MockClientProvider(client, clientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            
            Assert.That(file.Content, Contains.Substring("api-version"));
            Assert.That(file.Content, Contains.Substring("maxpagesize"));
        }

        [Test]
        public void ContentTypeHeaderWrappedInNullCheckWhenContentIsOptional()
        {
            // Test that when there's an optional body parameter with a Content-Type header,
            // the Content-Type header setting is wrapped in a null check for the content parameter
            var contentTypeParam = InputFactory.HeaderParameter(
                "Content-Type",
                InputFactory.Literal.String("application/json"),
                isRequired: true,
                isContentType: true,
                scope: InputParameterScope.Constant);
            var bodyParam = InputFactory.BodyParameter(
                "body",
                InputPrimitiveType.String,
                isRequired: false);
            var operation = InputFactory.Operation(
                "TestOperation",
                requestMediaTypes: ["application/json"],
                parameters: [contentTypeParam, bodyParam]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            MockHelpers.LoadMockGenerator(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var restClient = client!.RestClient;
            Assert.IsNotNull(restClient);

            var createMethod = restClient.Methods.FirstOrDefault(m => m.Signature.Name == "CreateTestOperationRequest");
            Assert.IsNotNull(createMethod, "CreateTestOperationRequest method not found");

            var statements = createMethod!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);

            var expectedStatement = @"if ((content != null))
{
    request.Headers.Set(""Content-Type"", ""application/json"");
}
";
            var statementsString = string.Join("\n", statements!.Select(s => s.ToDisplayString()));
            Assert.IsTrue(statements!.Any(s => s.ToDisplayString() == expectedStatement),
                $"Expected to find statement:\n{expectedStatement}\nBut got statements:\n{statementsString}");
        }
    }
}
