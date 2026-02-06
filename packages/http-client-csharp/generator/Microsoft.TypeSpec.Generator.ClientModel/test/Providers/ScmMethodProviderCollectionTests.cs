// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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
        public void TestDefaultCSharpMethodCollection(InputServiceMethod serviceMethod)
        {
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)));

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var method = methodCollection![0];
            var signature = method.Signature;
            Assert.IsNotNull(signature);
            var operation = serviceMethod.Operation;
            Assert.AreEqual(operation.Name.ToIdentifierName(), signature.Name);

            var parameters = signature.Parameters;
            Assert.IsNotNull(parameters);
            Assert.AreEqual(operation.Parameters.Count + 1, parameters.Count);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                    && m.Signature.Name == $"{operation.Name.ToIdentifierName()}");
            Assert.IsNotNull(convenienceMethod);
            Assert.AreEqual(serviceMethod, convenienceMethod!.ServiceMethod);

            var convenienceMethodParams = convenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(convenienceMethodParams);

            var spreadInputParameter = operation.Parameters.FirstOrDefault(p => p.Scope == InputParameterScope.Spread);
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
        public void ConvenienceMethodsHaveOptionalCancellationToken(InputServiceMethod serviceMethod)
        {
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(bool)));

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var operation = serviceMethod.Operation;
            var asyncConvenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                    && m.Signature.Name == $"{operation.Name.ToIdentifierName()}Async");
            Assert.IsNotNull(asyncConvenienceMethod);

            var asyncConvenienceMethodParameters = asyncConvenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(asyncConvenienceMethodParameters);

            var lastParameter = asyncConvenienceMethodParameters.Last();
            Assert.IsTrue(lastParameter.Type.Equals(typeof(CancellationToken)));
            Assert.IsFalse(lastParameter.Type.IsNullable);
            Assert.AreEqual(Snippet.Default, lastParameter.DefaultValue);

            var syncConvenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "content")
                   && m.Signature.Name == operation.Name.ToIdentifierName());
            Assert.IsNotNull(syncConvenienceMethod);

            var syncConvenienceMethodParameters = syncConvenienceMethod!.Signature.Parameters;
            Assert.IsNotNull(syncConvenienceMethodParameters);

            lastParameter = syncConvenienceMethodParameters.Last();
            Assert.IsTrue(lastParameter.Type.Equals(typeof(CancellationToken)));
            Assert.IsFalse(lastParameter.Type.IsNullable);
            Assert.AreEqual(Snippet.Default, lastParameter.DefaultValue);
        }

        [Test]
        public async Task SpreadModelCanonicalViewIsUsedToFindConstructor()
        {
            var serviceMethod = InputFactory.BasicServiceMethod(
                "CreateMessage",
                InputFactory.Operation(
                    "CreateMessage",
                    parameters:
                    [
                        InputFactory.BodyParameter(
                            "spread",
                            _spreadModel,
                            isRequired: true,
                            scope: InputParameterScope.Spread),
                        InputFactory.PathParameter(
                            "p1",
                            InputPrimitiveType.Boolean,
                            isRequired: true,
                            scope: InputParameterScope.Method)
                    ]),
                parameters:
                [
                    InputFactory.MethodParameter("p2", InputPrimitiveType.String, isRequired: true, scope: InputParameterScope.Spread),
                    InputFactory.MethodParameter(
                        "p1",
                        InputPrimitiveType.Boolean,
                        location: InputRequestLocation.Path,
                        isRequired: true,
                        scope: InputParameterScope.Method)
                ]);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);

            var convenienceMethods = methodCollection.Where(m => m.Signature.Parameters.All(p => p.Name != "content")).ToList();
            Assert.AreEqual(2, convenienceMethods.Count);
            foreach (var method in convenienceMethods)
            {
                StringAssert.Contains(
                    "global::Sample.Models.SpreadModel spreadModel = new global::Sample.Models.SpreadModel(p2, default);",
                    method.BodyStatements!.ToDisplayString());
            }

        }

        // Validate that spread model correctly instantiates optional dictionary properties
        [Test]
        public async Task SpreadModelWithOptionalDictionaryIsNotNull()
        {
            var spreadModelWithDict = InputFactory.Model(
                "spreadModelWithDict",
                usage: InputModelTypeUsage.Spread,
                properties:
                [
                    InputFactory.Property("query", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: false),
                    InputFactory.Property("filter", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: false),
                    InputFactory.Property("requiredParam", InputPrimitiveType.String, isRequired: true),
                ]);

            var serviceMethod = InputFactory.BasicServiceMethod(
                "CreateMessage",
                InputFactory.Operation(
                    "CreateMessage",
                    parameters:
                    [
                        InputFactory.BodyParameter(
                            "spread",
                            spreadModelWithDict,
                            isRequired: true,
                            scope: InputParameterScope.Spread),
                    ]),
                parameters:
                [
                    InputFactory.MethodParameter("query", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: false, scope: InputParameterScope.Spread),
                    InputFactory.MethodParameter("filter", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: false, scope: InputParameterScope.Spread),
                    InputFactory.MethodParameter("requiredParam", InputPrimitiveType.String, isRequired: true, scope: InputParameterScope.Spread)
                ]);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);

            var convenienceMethods = methodCollection.Where(m => m.Signature.Parameters.All(p => p.Name != "content")).ToList();
            Assert.AreEqual(2, convenienceMethods.Count);

            var asyncConvenienceMethod = convenienceMethods.FirstOrDefault(m => m.Signature.Name.EndsWith("Async"));
            Assert.IsNotNull(asyncConvenienceMethod);

            var methodBody = asyncConvenienceMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), methodBody);
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
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            // there should be no CollectionResultDefinition
            Assert.IsFalse(ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.Any(t => t is CollectionResultDefinition));

            var methodCollection = new ScmMethodProviderCollection(inputClient.Methods.First(), client!);
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
            var pagingMetadata = InputFactory.PagingMetadata(
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
            var operation = InputFactory.Operation("getCats", responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("Test", operation, pagingMetadata: pagingMetadata);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [inputClient]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            // there should be a CollectionResultDefinition
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
               t => t is CollectionResultDefinition);
            Assert.IsNotNull(collectionResultDefinition);

            var methodCollection = new ScmMethodProviderCollection(inputClient.Methods.First(), client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var listMethod = methodCollection.FirstOrDefault(
                m => !m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "GetCats");
            Assert.IsNotNull(listMethod);

            var signature = listMethod!.Signature;
            var expectedReturnType = new CSharpType(typeof(CollectionResult));
            Assert.IsTrue(signature.ReturnType!.Equals(expectedReturnType));
        }

        [TestCase(true, InputRequestLocation.Header)]
        [TestCase(true, InputRequestLocation.Body)]
        [TestCase(false, InputRequestLocation.Header)]
        [TestCase(false, InputRequestLocation.Body)]
        public void ListMethodWithEnumParameter(bool isExtensible, InputRequestLocation location)
        {
            var enumType = InputFactory.StringEnum("color", [("red", "red")], isExtensible: isExtensible);
            InputParameter parameter = InputFactory.BodyParameter("color", enumType, isRequired: true);
            switch (location)
            {
                case InputRequestLocation.Header:
                    parameter = InputFactory.HeaderParameter("color", enumType, isRequired: true);
                    break;
                case InputRequestLocation.Body:
                    parameter = InputFactory.BodyParameter("color", enumType, isRequired: true);
                    break;
            }
            IReadOnlyList<InputParameter> parameters = [parameter];
            IReadOnlyList<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter(
                "color",
                enumType,
                location: location,
                isRequired: true)
            ];
            var pagingMetadata = InputFactory.PagingMetadata(
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
            var operation = InputFactory.Operation("getCats", responses: [response], parameters: parameters);
            var inputServiceMethod = InputFactory.PagingServiceMethod("Test", operation, pagingMetadata: pagingMetadata, parameters: methodParameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel], clients: () => [inputClient]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            // there should be a CollectionResultDefinition
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
               t => t is CollectionResultDefinition);
            Assert.IsNotNull(collectionResultDefinition);

            var methodCollection = new ScmMethodProviderCollection(inputClient.Methods.First(), client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var convenienceMethod = methodCollection.FirstOrDefault(
                m => !m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "GetCats");
            Assert.IsNotNull(convenienceMethod);

            var signature = convenienceMethod!.Signature;
            var expectedReturnType = new CSharpType(typeof(CollectionResult));
            Assert.IsTrue(signature.ReturnType!.Equals(expectedReturnType));

            var colorParameter = signature.Parameters.FirstOrDefault(p => p.Name == "color");
            Assert.IsNotNull(colorParameter);
            var expectedType = ScmCodeModelGenerator.Instance.TypeFactory.CreateEnum(enumType);
            Assert.IsTrue(expectedType!.Type.Equals(colorParameter!.Type));

            if (location == InputRequestLocation.Header)
            {
                if (isExtensible)
                {
                    StringAssert.Contains("color.ToString()", convenienceMethod.BodyStatements!.ToDisplayString());
                }
                else
                {
                    StringAssert.Contains("color.ToSerialString()",
                        convenienceMethod.BodyStatements!.ToDisplayString());
                }
            }
            else
            {
                if (isExtensible)
                {
                    StringAssert.Contains("BinaryData.FromObjectAsJson(color.ToString())", convenienceMethod.BodyStatements!.ToDisplayString());
                }
                else
                {
                    StringAssert.Contains("BinaryData.FromObjectAsJson(color.ToSerialString())",
                        convenienceMethod.BodyStatements!.ToDisplayString());
                }
            }
        }

        [TestCase(true, false, true)]
        [TestCase(true, true, true)]
        [TestCase(false, false, false)]
        [TestCase(false, true, false)]
        public void RequestOptionsOptionality(bool inBody, bool hasOptionalParameter, bool shouldBeOptional)
        {
            MockHelpers.LoadMockGenerator();
            InputParameter parameter = inBody
                ? InputFactory.BodyParameter("message", InputPrimitiveType.Boolean, isRequired: !hasOptionalParameter)
                : InputFactory.QueryParameter("message", InputPrimitiveType.Boolean, isRequired: !hasOptionalParameter);
            IReadOnlyList<InputParameter> parameters = [parameter];
            IReadOnlyList<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter(
                "message",
                InputPrimitiveType.Boolean,
                location: inBody ? InputRequestLocation.Body : InputRequestLocation.Query,
                isRequired: !hasOptionalParameter)
            ];
            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: parameters);
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", inputOperation, parameters: methodParameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            var protocolMethod = methodCollection.FirstOrDefault(
                m => m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "TestOperation");
            Assert.IsNotNull(protocolMethod);
            Assert.AreEqual(inputServiceMethod, protocolMethod!.ServiceMethod);

            var optionsParameter = protocolMethod!.Signature.Parameters.Single(p => p.Name == "options");
            Assert.AreEqual(shouldBeOptional, optionsParameter.DefaultValue != null);

            if (!shouldBeOptional)
            {
                Assert.IsTrue(protocolMethod.Signature.Parameters.All(p => p.DefaultValue == null));
            }
        }

        [Test]
        public void RequestOptionsIsOptionalWhenNoConvenience()
        {
            MockHelpers.LoadMockGenerator();
            var inputOperation = InputFactory.Operation(
                "TestOperation",
                generateConvenienceMethod: false);
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            var protocolMethod = methodCollection.FirstOrDefault(
                m => m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "TestOperation");
            Assert.IsNotNull(protocolMethod);
            Assert.AreEqual(inputServiceMethod, protocolMethod!.ServiceMethod);

            var optionsParameter = protocolMethod!.Signature.Parameters.Single(p => p.Name == "options");
            Assert.IsNotNull(optionsParameter.DefaultValue);
        }

        [Test]
        public void ProtocolMethodWithMultipleOptionalParameters()
        {
            MockHelpers.LoadMockGenerator();
            List<InputQueryParameter> parameters =
            [
                InputFactory.QueryParameter(
                    "required1",
                    InputPrimitiveType.String,
                    isRequired: true),
                InputFactory.QueryParameter(
                    "optional1",
                    InputPrimitiveType.String,
                    isRequired: false),
                InputFactory.QueryParameter(
                    "optional2",
                    InputPrimitiveType.Int32,
                    isRequired: false),
                InputFactory.QueryParameter(
                    "optional3",
                    InputPrimitiveType.Boolean,
                    isRequired: false)
            ];
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter(
                    "required1",
                    InputPrimitiveType.String,
                    isRequired: true,
                    location: InputRequestLocation.Query),
                InputFactory.MethodParameter(
                    "optional1",
                    InputPrimitiveType.String,
                    isRequired: false,
                    location: InputRequestLocation.Query),
                InputFactory.MethodParameter(
                    "optional2",
                    InputPrimitiveType.Int32,
                    isRequired: false,
                    location: InputRequestLocation.Query),
                InputFactory.MethodParameter(
                    "optional3",
                    InputPrimitiveType.Boolean,
                    isRequired: false,
                    location: InputRequestLocation.Query)
            ];
            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: parameters);
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", inputOperation, parameters: methodParameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            var protocolMethods = methodCollection.Where(m =>
                m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name.StartsWith("TestOperation")).ToList();
            Assert.AreEqual(2, protocolMethods.Count);

            foreach (var protocolMethod in protocolMethods)
            {
                Assert.AreEqual(inputServiceMethod, protocolMethod.ServiceMethod);

                var protocolMethodParameters = protocolMethod.Signature.Parameters;

                // First required parameter should remain required
                var required1Param = protocolMethodParameters.Single(p => p.Name == "required1");
                Assert.IsNull(required1Param.DefaultValue, "Required parameter should remain required");
                Assert.IsFalse(required1Param.Type.IsNullable, "Required parameter should not be nullable");

                // First optional parameter should become required nullable
                var optional1Param = protocolMethodParameters.Single(p => p.Name == "optional1");
                Assert.IsNull(optional1Param.DefaultValue, "First optional parameter should become required");
                Assert.IsTrue(optional1Param.Type.IsNullable, "First optional parameter should be nullable");

                // Subsequent optional parameters still need to be made required
                var optional2Param = protocolMethodParameters.Single(p => p.Name == "optional2");
                Assert.IsNull(optional2Param.DefaultValue, "Second optional parameter should be required");
                Assert.IsTrue(optional2Param.Type.IsNullable, "Second optional parameter should be nullable");

                var optional3Param = protocolMethodParameters.Single(p => p.Name == "optional3");
                Assert.IsNull(optional3Param.DefaultValue, "Third optional parameter should be required");
                Assert.IsTrue(optional3Param.Type.IsNullable, "Third optional parameter should be nullable");

                // RequestOptions should be required
                var optionsParameter = protocolMethodParameters.Single(p => p.Name == "options");
                Assert.IsNull(optionsParameter.DefaultValue, "RequestOptions should be required");
            }
        }

        [Test]
        public void ProtocolMethodWithOptionalBodyParameter()
        {
            MockHelpers.LoadMockGenerator();
            List<InputParameter> parameters =
           [
               InputFactory.QueryParameter(
                    "required1",
                    InputPrimitiveType.String,
                    isRequired: true),
                InputFactory.BodyParameter(
                    "optional1",
                    InputPrimitiveType.String,
                    isRequired: false),
                InputFactory.QueryParameter(
                    "optional2",
                    InputPrimitiveType.Int32,
                    isRequired: false),
            ];
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter(
                    "required1",
                    InputPrimitiveType.String,
                    isRequired: true,
                    location: InputRequestLocation.Query),
                InputFactory.MethodParameter(
                    "optional1",
                    InputPrimitiveType.String,
                    isRequired: false,
                    location: InputRequestLocation.Body),
                InputFactory.MethodParameter(
                    "optional2",
                    InputPrimitiveType.Int32,
                    isRequired: false,
                    location: InputRequestLocation.Query),
            ];
            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: parameters);
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", inputOperation, parameters: methodParameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            var protocolMethods = methodCollection.Where(m =>
                m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name.StartsWith("TestOperation")).ToList();
            Assert.AreEqual(2, protocolMethods.Count);

            foreach (var protocolMethod in protocolMethods)
            {
                Assert.AreEqual(inputServiceMethod, protocolMethod.ServiceMethod);

                var protocolMethodParameters = protocolMethod.Signature.Parameters;

                // First required parameter should remain required
                var required1Param = protocolMethodParameters.Single(p => p.Name == "required1");
                Assert.IsNull(required1Param.DefaultValue, "Required parameter should remain required");
                Assert.IsFalse(required1Param.Type.IsNullable, "Required parameter should not be nullable");

                // Body parameter should become required nullable
                var bodyParam = protocolMethodParameters.Single(p => p.Name == "content");
                Assert.IsNull(bodyParam.DefaultValue, "Body parameter should become required");
                Assert.AreEqual(ParameterValidationType.None, bodyParam.Validation, "Body parameter should not have any validation");

                // Subsequent optional parameters should remain optional
                var optional2Param = protocolMethodParameters.Single(p => p.Name == "optional2");
                Assert.IsNotNull(optional2Param.DefaultValue, "Second optional parameter should remain optional");
                Assert.IsTrue(optional2Param.Type.IsNullable, "Second optional parameter should not be nullable");

                // RequestOptions should be optional
                var optionsParameter = protocolMethodParameters.Single(p => p.Name == "options");
                Assert.IsNotNull(optionsParameter.DefaultValue, "RequestOptions should be optional");
            }
        }

        [Test]
        public void OperationWithOptionalEnum()
        {
            MockHelpers.LoadMockGenerator();
            ScmMethodProvider? convenienceMethod = SetupOptionalEnumTest(false);

            var statements = convenienceMethod!.BodyStatements!.ToDisplayString();
            StringAssert.Contains("choice?.ToSerialString()", statements);
        }

        [Test]
        public void OperationWithOptionalExtensibleEnum()
        {
            MockHelpers.LoadMockGenerator();
            ScmMethodProvider? convenienceMethod = SetupOptionalEnumTest(true);

            var statements = convenienceMethod!.BodyStatements!.ToDisplayString();
            StringAssert.Contains("choice?.ToString()", statements);
        }

        [Test]
        public void OperationWithOptionalIntEnum()
        {
            MockHelpers.LoadMockGenerator();
            ScmMethodProvider? convenienceMethod = SetupOptionalEnumTest(false, true);

            var statements = convenienceMethod!.BodyStatements!.ToDisplayString();
            StringAssert.Contains("(int)choice", statements);
        }

        [Test]
        public void OperationWithOptionalExtensibleIntEnum()
        {
            MockHelpers.LoadMockGenerator();
            ScmMethodProvider? convenienceMethod = SetupOptionalEnumTest(true, true);

            var statements = convenienceMethod!.BodyStatements!.ToDisplayString();
            StringAssert.Contains("choice?.ToSerialInt32()", statements);
        }

        private static ScmMethodProvider? SetupOptionalEnumTest(bool isExtensible, bool useInt = false)
        {
            List<InputParameter> parameters =
            [
                InputFactory.QueryParameter(
                    "choice",
                    useInt
                        ? InputFactory.Int32Enum("TestEnum", [("Value1", 1), ("Value2", 2)], isExtensible: isExtensible)
                        : InputFactory.StringEnum("TestEnum", [("Value1", "value1"), ("Value2", "value2")], isExtensible: isExtensible),
                    isRequired: false)
            ];
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter(
                    "choice",
                    useInt
                        ? InputFactory.Int32Enum("TestEnum", [("Value1", 1), ("Value2", 2)], isExtensible: isExtensible)
                        : InputFactory.StringEnum("TestEnum", [("Value1", "value1"), ("Value2", "value2")], isExtensible: isExtensible),
                    isRequired: false,
                    location: InputRequestLocation.Query)
            ];
            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: parameters);
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", inputOperation, parameters: methodParameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(clients: () => [inputClient]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(inputClient.Methods.First(), client!);
            Assert.IsNotNull(methodCollection);
            Assert.AreEqual(4, methodCollection.Count);

            var convenienceMethod = methodCollection.FirstOrDefault(
                m => !m.Signature.Parameters.Any(p => p.Name == "options") && m.Signature.Name == "TestOperation");
            return convenienceMethod;
        }

        private static IEnumerable<TestCaseData> RequestBodyTypesSource()
        {
            yield return new TestCaseData(
                InputFactory.Array(
                    InputFactory.Model("cat", properties:
                    [
                        InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
                    ])));

            yield return new TestCaseData(
                InputFactory.Dictionary(
                    InputFactory.Model("cat", properties:
                    [
                        InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
                    ])));

            yield return new TestCaseData(
                    InputFactory.Model("cat", properties:
                    [
                        InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
                    ]));
        }

        [TestCaseSource(nameof(RequestBodyTypesSource))]
        public void RequestBodyConstructedUsingBinaryContentHelpers(InputType inputType)
        {
            MockHelpers.LoadMockGenerator();
            var parameter = InputFactory.BodyParameter("message", inputType, isRequired: true);
            var methodParameter = InputFactory.MethodParameter(
                "message",
                inputType,
                location: InputRequestLocation.Body,
                isRequired: true);

            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: [parameter]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("TestOperation", inputOperation,
                parameters: [methodParameter]);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            var convenienceMethod = methodCollection.FirstOrDefault(
                m => m.Signature.Parameters.Any(p => p.Name == "message") && m.Signature.Name == "TestOperation");
            Assert.IsNotNull(convenienceMethod);

            if (inputType is InputArrayType)
            {
                Assert.IsTrue(convenienceMethod!.BodyStatements!.ToDisplayString()
                    .Contains("using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(message);"));
            }
            else if (inputType is InputDictionaryType)
            {
                Assert.IsTrue(convenienceMethod!.BodyStatements!.ToDisplayString()
                    .Contains("using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromDictionary(message);"));
            }
            else
            {
                Assert.IsFalse(convenienceMethod!.BodyStatements!.ToDisplayString().Contains("BinaryContentHelper"));
            }
        }

        [Test]
        public void RequestBodyConstructedUsingReadOnlyMemoryBinaryContentHelpers()
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: _ => new CSharpType(typeof(ReadOnlyMemory<int>)));
            var inputType = InputFactory.Array(InputPrimitiveType.Int32);

            var parameter = InputFactory.BodyParameter("data", inputType, isRequired: true);
            var methodParameter = InputFactory.MethodParameter(
                "data",
                inputType,
                location: InputRequestLocation.Body,
                isRequired: true);

            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: [parameter]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("TestOperation", inputOperation,
                parameters: [methodParameter]);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            var convenienceMethod = methodCollection.FirstOrDefault(
                m => m.Signature.Parameters.Any(p => p.Name == "data") && m.Signature.Name == "TestOperation");
            Assert.IsNotNull(convenienceMethod);

            Assert.IsTrue(convenienceMethod!.BodyStatements!.ToDisplayString()
                .Contains("using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(data.Span);"));
        }

        [Test]
        public void CanRemoveParameterFromMethods()
        {
            var parameter1 = InputFactory.HeaderParameter("toRemove", InputPrimitiveType.String, isRequired: true);
            var parameter2 = InputFactory.HeaderParameter("data", InputPrimitiveType.String, isRequired: true);
            var methodParameter1 = InputFactory.MethodParameter("toRemove", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Header);
            var methodParameter2 = InputFactory.MethodParameter("data", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Header);

            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: [parameter1, parameter2]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("TestOperation", inputOperation,
                parameters: [methodParameter1, methodParameter2]);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            MockHelpers.LoadMockGenerator(createParameterCore: parameter =>
            {
                if (parameter.Name == "toRemove")
                {
                    return null;
                }
                return new ParameterProvider(parameter);
            });
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            foreach (var method in methodCollection)
            {
                // Ensure that the parameter "toRemove" is not present in the method signature
                Assert.IsFalse(method.Signature.Parameters.Any(p => p.Name == "toRemove"));
            }

            var restClient = client!.RestClient;
            foreach (var method in restClient.Methods)
            {
                // Ensure that the parameter "toRemove" is not present in the rest client method signature
                Assert.IsFalse(method.Signature.Parameters.Any(p => p.Name == "toRemove"));
            }
        }

        [TestCaseSource(nameof(RequestBodyTypesSource))]
        public void RequestBodyConstructedRespectingRequestContentApi(InputType inputType)
        {
            MockHelpers.LoadMockGenerator(requestContentApi: TestRequestContentApi.Instance);
            var parameter = InputFactory.BodyParameter("message", inputType, isRequired: true);
            var methodParameter = InputFactory.MethodParameter("message", inputType, isRequired: true);

            var inputOperation = InputFactory.Operation(
                "TestOperation",
                parameters: [parameter]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("TestOperation", inputOperation,
                parameters: [methodParameter]);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            var convenienceMethod = methodCollection.FirstOrDefault(
                m => m.Signature.Parameters.Any(p => p.Name == "message") && m.Signature.Name == "TestOperation");
            Assert.IsNotNull(convenienceMethod);

            if (inputType is InputArrayType)
            {
                Assert.IsTrue(convenienceMethod!.BodyStatements!.ToDisplayString()
                    .Contains("using global::Microsoft.TypeSpec.Generator.ClientModel.Tests.TestRequestContent content = global::Sample.BinaryContentHelper.FromEnumerable(message);"));
            }
            else if (inputType is InputDictionaryType)
            {
                Assert.IsTrue(convenienceMethod!.BodyStatements!.ToDisplayString()
                    .Contains("using global::Microsoft.TypeSpec.Generator.ClientModel.Tests.TestRequestContent content = global::Sample.BinaryContentHelper.FromDictionary(message);"));
            }
            else
            {
                Assert.IsFalse(convenienceMethod!.BodyStatements!.ToDisplayString().Contains("BinaryContentHelper"));
            }
        }

        [Test]
        public void ListMethodIsRenamedToGet()
        {
            MockHelpers.LoadMockGenerator(requestContentApi: TestRequestContentApi.Instance);

            var inputOperation = InputFactory.Operation(
                "ListCats");

            var inputServiceMethod = InputFactory.BasicServiceMethod("ListCats", inputOperation);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);
            foreach (var method in methodCollection)
            {
                if (method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async))
                {
                    Assert.AreEqual("GetCatsAsync", method.Signature.Name);
                }
                else
                {
                    Assert.AreEqual("GetCats", method.Signature.Name);
                }
            }
        }

        [TestCase(typeof(int))]
        [TestCase(typeof(long))]
        [TestCase(typeof(float))]
        [TestCase(typeof(double))]
        [TestCase(typeof(bool))]
        [TestCase(typeof(string))]
        [TestCase(typeof(Uri))]
        [TestCase(typeof(BinaryData))]
        [TestCase(typeof(DateTimeOffset))]
        [TestCase(typeof(TimeSpan))]
        public void ScalarReturnTypeMethods(Type type)
        {
            InputType? inputType = type switch
            {
                { } t when t == typeof(float) => InputPrimitiveType.Float32,
                { } t when t == typeof(double) => InputPrimitiveType.Float64,
                { } t when t == typeof(bool) => InputPrimitiveType.Boolean,
                { } t when t == typeof(string) => InputPrimitiveType.String,
                { } t when t == typeof(DateTimeOffset) => InputPrimitiveType.PlainDate,
                { } t when t == typeof(TimeSpan) => InputPrimitiveType.PlainTime,
                { } t when t == typeof(int) => InputPrimitiveType.Int32,
                { } t when t == typeof(long) => InputPrimitiveType.Int64,
                { } t when t == typeof(Uri) => InputPrimitiveType.Url,
                { } t when t == typeof(BinaryData) => InputPrimitiveType.Base64,
                _ => null
            };

            var inputOperation = InputFactory.Operation(
                "GetScalar",
                responses: [InputFactory.OperationResponse([200], inputType!)]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("GetScalar", inputOperation);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);
            var convenienceMethod = methodCollection.FirstOrDefault(m
                => m.Signature.Parameters.All(p => p.Name != "options")
                   && m.Signature.Name == $"{inputOperation.Name.ToIdentifierName()}");

            Assert.AreEqual(Helpers.GetExpectedFromFile(type.Name), convenienceMethod!.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void TestUnionResponseType()
        {
            var inputUnionFooType = InputFactory.Union([InputFactory.Model("Foo", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
            ])], "foo");
            var inputType = InputFactory.Union([inputUnionFooType], "bar");
            var inputOperation = InputFactory.Operation(
                "GetUnion",
                responses: [InputFactory.OperationResponse([200], inputType!)]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("GetScalar", inputOperation);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);
            var convenienceMethod = methodCollection.FirstOrDefault(m
                => m.Signature.Parameters.All(p => p.Name != "options")
                   && m.Signature.Name == $"{inputOperation.Name.ToIdentifierName()}");

            var responseType = convenienceMethod!.Signature.ReturnType;
            Assert.IsNotNull(responseType);
            Assert.AreEqual(new CSharpType(typeof(ClientResult<BinaryData>)), responseType);
        }

        [Test]
        public void RequiredLiteralParametersAreFilteredFromParameters()
        {
            var inputUnionFooType = InputFactory.Union([InputFactory.Model("Foo", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
            ])], "foo");
            var inputType = InputFactory.Union([inputUnionFooType], "bar");
            var inputOperation = InputFactory.Operation(
                "GetOperation",
                parameters:
                [
                    InputFactory.QueryParameter("queryParam", InputFactory.Literal.String("value"), isRequired: true),
                    InputFactory.HeaderParameter("headerParam", InputFactory.Literal.String("value"), isRequired: true),
                    InputFactory.BodyParameter("bodyParam", InputFactory.Literal.String("value"), isRequired: true)
                ],
                responses: [InputFactory.OperationResponse([200], inputType!)]);

            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "GetOperation",
                inputOperation,
                parameters:
                [
                    InputFactory.MethodParameter("queryParam", InputFactory.Literal.String("value"), isRequired: true, location: InputRequestLocation.Query),
                    InputFactory.MethodParameter("headerParam", InputFactory.Literal.String("value"), isRequired: true, location: InputRequestLocation.Header),
                    InputFactory.MethodParameter("bodyParam", InputFactory.Literal.String("value"), isRequired: true, location: InputRequestLocation.Body)
                ]);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => m.Signature.Parameters.All(p => p.Name != "options")
                   && m.Signature.Name == $"{inputOperation.Name.ToIdentifierName()}");

            Assert.IsNotNull(convenienceMethod);
            Assert.AreEqual(1, convenienceMethod!.Signature.Parameters.Count);

            var protocolMethod = methodCollection.FirstOrDefault(m
                => m.Signature.Parameters.Any(p => p.Name == "options")
                   && m.Signature.Name == $"{inputOperation.Name.ToIdentifierName()}");
            Assert.IsNotNull(protocolMethod);
            Assert.AreEqual(1, protocolMethod!.Signature.Parameters.Count);
        }

        [TestCase(typeof(int))]
        [TestCase(typeof(long))]
        [TestCase(typeof(float))]
        [TestCase(typeof(double))]
        [TestCase(typeof(bool))]
        [TestCase(typeof(string))]
        [TestCase(typeof(Uri))]
        [TestCase(typeof(BinaryData))]
        [TestCase(typeof(DateTimeOffset))]
        [TestCase(typeof(TimeSpan))]
        public void ScalarInputTypeMethods(Type type)
        {
            InputType? inputType = type switch
            {
                { } t when t == typeof(float) => InputPrimitiveType.Float32,
                { } t when t == typeof(double) => InputPrimitiveType.Float64,
                { } t when t == typeof(bool) => InputPrimitiveType.Boolean,
                { } t when t == typeof(string) => InputPrimitiveType.String,
                { } t when t == typeof(DateTimeOffset) => InputPrimitiveType.PlainDate,
                { } t when t == typeof(TimeSpan) => InputPrimitiveType.PlainTime,
                { } t when t == typeof(int) => InputPrimitiveType.Int32,
                { } t when t == typeof(long) => InputPrimitiveType.Int64,
                { } t when t == typeof(Uri) => InputPrimitiveType.Url,
                { } t when t == typeof(BinaryData) => InputPrimitiveType.Base64,
                _ => null
            };

            var inputOperation = InputFactory.Operation(
                "PutScalar",
                parameters: [InputFactory.BodyParameter("value", inputType!, isRequired: true)],
                responses: [InputFactory.OperationResponse([200])]);

            var inputServiceMethod = InputFactory.BasicServiceMethod(
                "PutScalar",
                inputOperation,
                parameters: [InputFactory.MethodParameter("value", inputType!, isRequired: true)]);

            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);
            var convenienceMethod = methodCollection.FirstOrDefault(m
                => m.Signature.Parameters.All(p => p.Name != "options")
                   && m.Signature.Name == $"{inputOperation.Name.ToIdentifierName()}");

            Assert.AreEqual(Helpers.GetExpectedFromFile(type.Name), convenienceMethod!.BodyStatements!.ToDisplayString());
        }

        public static IEnumerable<TestCaseData> DefaultCSharpMethodCollectionTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.BasicServiceMethod(
                    "CreateMessage",
                    InputFactory.Operation(
                        "CreateMessage",
                        parameters:
                        [
                            InputFactory.BodyParameter(
                                "message",
                                InputPrimitiveType.Boolean,
                                isRequired: true)
                        ]),
                    parameters:
                    [
                        InputFactory.MethodParameter(
                            "message",
                            InputPrimitiveType.Boolean,
                            isRequired: true)
                    ]));

                // method with spread parameter
                yield return new TestCaseData(InputFactory.BasicServiceMethod(
                    "CreateMessage",
                    InputFactory.Operation(
                        "CreateMessage",
                        parameters:
                        [
                            InputFactory.BodyParameter(
                                "spread",
                                _spreadModel,
                                isRequired: true,
                                scope: InputParameterScope.Spread),
                            InputFactory.PathParameter(
                                "p1",
                                InputPrimitiveType.Boolean,
                                isRequired: true,
                                scope: InputParameterScope.Method)
                        ]),
                    parameters:
                    [
                        InputFactory.MethodParameter("p2", InputPrimitiveType.String, isRequired: true, scope: InputParameterScope.Spread),
                        InputFactory.MethodParameter(
                                "p1",
                                InputPrimitiveType.Boolean,
                                location: InputRequestLocation.Path,
                                isRequired: true,
                                scope: InputParameterScope.Method)
                    ]));
            }
        }

        [Test]
        public void TestMethodTypeIdentification()
        {
            MockHelpers.LoadMockGenerator();

            var inputOperation = InputFactory.Operation("TestOperation");
            var inputServiceMethod = InputFactory.BasicServiceMethod("Test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);

            // Verify protocol methods
            var protocolMethods = methodCollection.Where(m => ((ScmMethodProvider)m).Kind == ScmMethodKind.Protocol).ToList();
            Assert.AreEqual(2, protocolMethods.Count); // sync + async

            // Verify convenience methods
            var convenienceMethods = methodCollection.Where(m => ((ScmMethodProvider)m).Kind == ScmMethodKind.Convenience).ToList();
            Assert.AreEqual(2, convenienceMethods.Count); // sync + async

            // Verify CreateRequest method
            var createRequestMethod = (ScmMethodProvider)client!.RestClient.GetCreateRequestMethod(inputOperation);
            Assert.AreEqual(ScmMethodKind.CreateRequest, createRequestMethod.Kind);
        }

        [Test]
        public async Task CollectionResultDefinitionAddedEvenWhenPagingMethodsCustomized()
        {
            var pagingMetadata = InputFactory.PagingMetadata(
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
            var operation = InputFactory.Operation("getCats", responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("Test", operation, pagingMetadata: pagingMetadata);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel],
                clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            // Verify CollectionResultDefinition is still added even though methods are customized
            var collectionResultDefinition = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.FirstOrDefault(
                t => t is CollectionResultDefinition);
            Assert.IsNotNull(collectionResultDefinition, "CollectionResultDefinition should be added even when paging methods are customized");
        }

        [TestCase(typeof(int))]
        [TestCase(typeof(long))]
        [TestCase(typeof(float))]
        [TestCase(typeof(double))]
        [TestCase(typeof(bool))]
        [TestCase(typeof(string))]
        [TestCase(typeof(DateTimeOffset))]
        public void ListOfPrimitivesUsesUtf8JsonReader(Type elementType)
        {
            InputType inputElementType = elementType switch
            {
                { } t when t == typeof(int) => InputPrimitiveType.Int32,
                { } t when t == typeof(long) => InputPrimitiveType.Int64,
                { } t when t == typeof(float) => InputPrimitiveType.Float32,
                { } t when t == typeof(double) => InputPrimitiveType.Float64,
                { } t when t == typeof(bool) => InputPrimitiveType.Boolean,
                { } t when t == typeof(string) => InputPrimitiveType.String,
                { } t when t == typeof(DateTimeOffset) => InputPrimitiveType.PlainDate,
                _ => throw new ArgumentException("Unsupported type")
            };

            var inputOperation = InputFactory.Operation(
                "GetList",
                responses: [InputFactory.OperationResponse([200], InputFactory.Array(inputElementType))]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("GetList", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "options")
                   && m.Signature.Name == "GetList");
            Assert.IsNotNull(convenienceMethod);

            var generatedCode = convenienceMethod!.BodyStatements!.ToDisplayString();

            Assert.AreEqual(Helpers.GetExpectedFromFile(elementType.Name), generatedCode);
        }

        [TestCase(typeof(TimeSpan))]
        [TestCase(typeof(BinaryData))]
        public void ListOfValueTypeUsesJsonDoc(Type elementType)
        {
            InputType inputElementType = elementType switch
            {
                { } t when t == typeof(TimeSpan) => InputPrimitiveType.PlainTime,
                { } t when t == typeof(BinaryData) => InputPrimitiveType.Base64,
                _ => throw new ArgumentException("Unsupported type")
            };

            var inputOperation = InputFactory.Operation(
                "GetList",
                responses: [InputFactory.OperationResponse([200], InputFactory.Array(inputElementType))]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("GetList", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "options")
                   && m.Signature.Name == "GetList");
            Assert.IsNotNull(convenienceMethod);

            var generatedCode = convenienceMethod!.BodyStatements!.ToDisplayString();

            Assert.AreEqual(Helpers.GetExpectedFromFile(elementType.Name), generatedCode);
        }

        [Test]
        public void TestDeserializeReadOnlyMemResponse()
        {
            var inputOperation = InputFactory.Operation(
                "GetList",
                responses: [InputFactory.OperationResponse([200], InputFactory.Array(InputPrimitiveType.Int32))]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("GetList", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator(
                clients: () => [inputClient],
                createCSharpTypeCore: input =>
                {
                    if (input is InputArrayType inputArrayType)
                    {
                        // Simulate a ReadOnlyMemory type
                        return new CSharpType(typeof(ReadOnlyMemory<int>));
                    }
                    return ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input)!;
                },
                createCSharpTypeCoreFallback: input => input is InputArrayType);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "options")
                   && m.Signature.Name == "GetList");
            Assert.IsNotNull(convenienceMethod);

            var generatedCode = convenienceMethod!.BodyStatements!.ToDisplayString();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), generatedCode);
        }

        [TestCase(typeof(int))]
        [TestCase(typeof(long))]
        [TestCase(typeof(float))]
        [TestCase(typeof(double))]
        [TestCase(typeof(bool))]
        [TestCase(typeof(string))]
        [TestCase(typeof(DateTimeOffset))]
        public void DictionaryOfPrimitivesUsesUtf8JsonReader(Type valueType)
        {
            InputType inputValueType = valueType switch
            {
                { } t when t == typeof(int) => InputPrimitiveType.Int32,
                { } t when t == typeof(long) => InputPrimitiveType.Int64,
                { } t when t == typeof(float) => InputPrimitiveType.Float32,
                { } t when t == typeof(double) => InputPrimitiveType.Float64,
                { } t when t == typeof(bool) => InputPrimitiveType.Boolean,
                { } t when t == typeof(string) => InputPrimitiveType.String,
                { } t when t == typeof(DateTimeOffset) => InputPrimitiveType.PlainDate,
                _ => throw new ArgumentException("Unsupported type")
            };

            var inputOperation = InputFactory.Operation(
                "GetDict",
                responses: [InputFactory.OperationResponse([200], InputFactory.Dictionary(inputValueType))]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("GetDict", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "options")
                   && m.Signature.Name == "GetDict");
            Assert.IsNotNull(convenienceMethod);

            var actualCode = convenienceMethod!.BodyStatements!.ToDisplayString();

            Assert.AreEqual(Helpers.GetExpectedFromFile(valueType.Name), actualCode);
        }

        [TestCase(typeof(TimeSpan))]
        [TestCase(typeof(BinaryData))]
        public void DictionaryOfValueTypeUsesJsonDoc(Type valueType)
        {
            InputType inputValueType = valueType switch
            {
                { } t when t == typeof(DateTimeOffset) => InputPrimitiveType.PlainDate,
                { } t when t == typeof(TimeSpan) => InputPrimitiveType.PlainTime,
                { } t when t == typeof(BinaryData) => InputPrimitiveType.Base64,
                _ => throw new ArgumentException("Unsupported type")
            };

            var inputOperation = InputFactory.Operation(
                "GetDict",
                responses: [InputFactory.OperationResponse([200], InputFactory.Dictionary(inputValueType))]);

            var inputServiceMethod = InputFactory.BasicServiceMethod("GetDict", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);

            MockHelpers.LoadMockGenerator();
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);

            var methodCollection = new ScmMethodProviderCollection(inputServiceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => !m.Signature.Parameters.Any(p => p.Name == "options")
                   && m.Signature.Name == "GetDict");
            Assert.IsNotNull(convenienceMethod);

            var actualCode = convenienceMethod!.BodyStatements!.ToDisplayString();

            Assert.AreEqual(Helpers.GetExpectedFromFile(valueType.Name), actualCode);
        }

        [Test]
        public async Task MethodParameterSegments_ExtractsPropertyValues()
        {
            // Test scenario: Verify MethodParameterSegments correctly maps convenience params to protocol params
            var wrapperModel = InputFactory.Model(
                "Wrapper",
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("p2", InputPrimitiveType.String, isRequired: true),
                ]);

            var p1Param = InputFactory.PathParameter("p1", InputPrimitiveType.String, isRequired: true);
            p1Param.Update(methodParameterSegments: [
                InputFactory.MethodParameter("wrapper", wrapperModel, isRequired: true),
                InputFactory.MethodParameter("p1", InputPrimitiveType.String, isRequired: true)
            ]);

            var p2Param = InputFactory.PathParameter("p2", InputPrimitiveType.String, isRequired: true);
            p2Param.Update(methodParameterSegments: [
                InputFactory.MethodParameter("wrapper", wrapperModel, isRequired: true),
                InputFactory.MethodParameter("p2", InputPrimitiveType.String, isRequired: true)
            ]);

            var serviceMethod = InputFactory.BasicServiceMethod(
                "testOp",
                InputFactory.Operation(
                    "testOp",
                    parameters: [p1Param, p2Param]),
                parameters: [InputFactory.MethodParameter("wrapper", wrapperModel, isRequired: true)]);

            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);

            // Verify that MethodParameterSegments are correctly set on the input parameters
            Assert.AreEqual(2, p1Param.MethodParameterSegments!.Count, "p1 should have 2 segments");
            Assert.AreEqual("wrapper", p1Param.MethodParameterSegments[0].Name);
            Assert.AreEqual("p1", p1Param.MethodParameterSegments[1].Name);

            Assert.AreEqual(2, p2Param.MethodParameterSegments!.Count, "p2 should have 2 segments");
            Assert.AreEqual("wrapper", p2Param.MethodParameterSegments[0].Name);
            Assert.AreEqual("p2", p2Param.MethodParameterSegments[1].Name);
        }

        [Test]
        public async Task MethodParameterSegments_BodyParameterSerialization()
        {
            // Test scenario: Body parameter with MethodParameterSegments should be serialized
            var wrapperModel = InputFactory.Model(
                "Wrapper",
                properties:
                [
                    InputFactory.Property("action", InputPrimitiveType.String, isRequired: true),
                ]);

            var bodyParam = InputFactory.BodyParameter("action", InputPrimitiveType.String, isRequired: true);
            bodyParam.Update(methodParameterSegments: [
                InputFactory.MethodParameter("wrapper", wrapperModel, isRequired: true),
                InputFactory.MethodParameter("action", InputPrimitiveType.String, isRequired: true)
            ]);

            var serviceMethod = InputFactory.BasicServiceMethod(
                "testOp",
                InputFactory.Operation(
                    "testOp",
                    parameters: [bodyParam]),
                parameters: [InputFactory.MethodParameter("wrapper", wrapperModel, isRequired: true)]);

            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);

            // Verify MethodParameterSegments are set correctly
            Assert.IsNotNull(bodyParam.MethodParameterSegments);
            Assert.AreEqual(2, bodyParam.MethodParameterSegments!.Count);
            Assert.AreEqual("wrapper", bodyParam.MethodParameterSegments[0].Name);
            Assert.AreEqual("action", bodyParam.MethodParameterSegments[1].Name);
        }

        [Test]
        public async Task MethodParameterSegments_MultipleSegments()
        {
            // Test scenario: Nested property access with 3+ segments
            var innerModel = InputFactory.Model(
                "Inner",
                properties:
                [
                    InputFactory.Property("data", InputPrimitiveType.String, isRequired: true),
                ]);

            var wrapperModel = InputFactory.Model(
                "Wrapper",
                properties:
                [
                    InputFactory.Property("inner", innerModel, isRequired: true),
                ]);

            var bodyParam = InputFactory.BodyParameter("data", InputPrimitiveType.String, isRequired: true);
            bodyParam.Update(methodParameterSegments: [
                InputFactory.MethodParameter("wrapper", wrapperModel, isRequired: true),
                InputFactory.MethodParameter("inner", innerModel, isRequired: true),
                InputFactory.MethodParameter("data", InputPrimitiveType.String, isRequired: true)
            ]);

            var serviceMethod = InputFactory.BasicServiceMethod(
                "testOp",
                InputFactory.Operation(
                    "testOp",
                    parameters: [bodyParam]),
                parameters: [InputFactory.MethodParameter("wrapper", wrapperModel, isRequired: true)]);

            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);

            // Verify 3-level nesting in MethodParameterSegments
            Assert.IsNotNull(bodyParam.MethodParameterSegments);
            Assert.AreEqual(3, bodyParam.MethodParameterSegments!.Count, "Should have 3 segments for nested property");
            Assert.AreEqual("wrapper", bodyParam.MethodParameterSegments[0].Name);
            Assert.AreEqual("inner", bodyParam.MethodParameterSegments[1].Name);
            Assert.AreEqual("data", bodyParam.MethodParameterSegments[2].Name);
        }

        [Test]
        public async Task MethodParameterSegments_MixedParameterLocations()
        {
            // Test scenario: Mix of path, query, header, and body parameters
            var paramsModel = InputFactory.Model(
                "Params",
                properties:
                [
                    InputFactory.Property("pathParam", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("queryParam", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("headerParam", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("bodyParam", InputPrimitiveType.String, isRequired: true),
                ]);

            var pathParam = InputFactory.PathParameter("pathParam", InputPrimitiveType.String, isRequired: true);
            pathParam.Update(methodParameterSegments: [
                InputFactory.MethodParameter("params", paramsModel, isRequired: true),
                InputFactory.MethodParameter("pathParam", InputPrimitiveType.String, isRequired: true)
            ]);

            var queryParam = InputFactory.QueryParameter("queryParam", InputPrimitiveType.String, isRequired: true);
            queryParam.Update(methodParameterSegments: [
                InputFactory.MethodParameter("params", paramsModel, isRequired: true),
                InputFactory.MethodParameter("queryParam", InputPrimitiveType.String, isRequired: true)
            ]);

            var headerParam = InputFactory.HeaderParameter("headerParam", InputPrimitiveType.String, isRequired: true);
            headerParam.Update(methodParameterSegments: [
                InputFactory.MethodParameter("params", paramsModel, isRequired: true),
                InputFactory.MethodParameter("headerParam", InputPrimitiveType.String, isRequired: true)
            ]);

            var bodyParam = InputFactory.BodyParameter("bodyParam", InputPrimitiveType.String, isRequired: true);
            bodyParam.Update(methodParameterSegments: [
                InputFactory.MethodParameter("params", paramsModel, isRequired: true),
                InputFactory.MethodParameter("bodyParam", InputPrimitiveType.String, isRequired: true)
            ]);

            var serviceMethod = InputFactory.BasicServiceMethod(
                "testOp",
                InputFactory.Operation(
                    "testOp",
                    parameters: [pathParam, queryParam, headerParam, bodyParam]),
                parameters: [InputFactory.MethodParameter("params", paramsModel, isRequired: true)]);

            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);

            // Verify all parameter types have MethodParameterSegments
            Assert.IsNotNull(pathParam.MethodParameterSegments);
            Assert.AreEqual(2, pathParam.MethodParameterSegments!.Count);

            Assert.IsNotNull(queryParam.MethodParameterSegments);
            Assert.AreEqual(2, queryParam.MethodParameterSegments!.Count);

            Assert.IsNotNull(headerParam.MethodParameterSegments);
            Assert.AreEqual(2, headerParam.MethodParameterSegments!.Count);

            Assert.IsNotNull(bodyParam.MethodParameterSegments);
            Assert.AreEqual(2, bodyParam.MethodParameterSegments!.Count);
        }

        [Test]
        public async Task MethodParameterSegments_UpdateMethod_SetsSegments()
        {
            // Test the InputParameter.Update method correctly sets MethodParameterSegments
            var model = InputFactory.Model("TestModel");
            var param = InputFactory.PathParameter("test", InputPrimitiveType.String, isRequired: true);

            // Initially should be null or empty
            Assert.IsTrue(param.MethodParameterSegments == null || param.MethodParameterSegments.Count == 0);

            // Update with segments
            var segments = new List<InputMethodParameter>
            {
                InputFactory.MethodParameter("param1", model, isRequired: true),
                InputFactory.MethodParameter("param2", InputPrimitiveType.String, isRequired: true)
            };
            param.Update(methodParameterSegments: segments);

            // Verify segments are set
            Assert.IsNotNull(param.MethodParameterSegments);
            Assert.AreEqual(2, param.MethodParameterSegments!.Count);
            Assert.AreEqual("param1", param.MethodParameterSegments[0].Name);
            Assert.AreEqual("param2", param.MethodParameterSegments[1].Name);
        }

        [Test]
        public async Task MissingOperationParamsResultInNamedArgsForSubsequent()
        {
            var idParam = InputFactory.PathParameter("id", InputPrimitiveType.String, isRequired: true);
            var takeParam = InputFactory.QueryParameter("take", InputPrimitiveType.Int32, isRequired: true);
            var filterParam = InputFactory.QueryParameter("filter", InputPrimitiveType.String, isRequired: false);
            var orderParam = InputFactory.HeaderParameter("order", InputPrimitiveType.String, isRequired: false);

            var serviceMethod = InputFactory.BasicServiceMethod(
                "TestOp",
                InputFactory.Operation(
                    "TestOp",
                    parameters: [idParam, filterParam, orderParam, takeParam],
                    responses: [InputFactory.OperationResponse([200])]),
                parameters:
                [
                    InputFactory.MethodParameter("id", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Path),
                    InputFactory.MethodParameter("take", InputPrimitiveType.Int32, isRequired: true, location: InputRequestLocation.Query),
                    InputFactory.MethodParameter("order", InputPrimitiveType.Int32, isRequired: true, location: InputRequestLocation.Header),
                ]);

            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => m.Signature.Parameters.All(p => p.Name != "options")
                   && m.Signature.Name == "TestOp");
            Assert.IsNotNull(convenienceMethod);

            var methodBody = convenienceMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), methodBody);
        }

        [Test]
        public async Task CombinedMissingOperationParamsAndNonBodyModelParams()
        {
            // Create a body model with HTTP metadata properties (header/query params)
            var requestModel = InputFactory.Model(
                "RequestModel",
                properties:
                [
                    InputFactory.Property("data", InputPrimitiveType.String, isRequired: true, isHttpMetadata: false),
                    InputFactory.Property("x-custom-header", InputPrimitiveType.String, isRequired: true, isHttpMetadata: true, wireName: "x-custom-header"),
                    InputFactory.Property("queryParam", InputPrimitiveType.Int32, isRequired: false, isHttpMetadata: true, wireName: "queryParam"),
                ]);

            // Protocol operation parameters
            var idParam = InputFactory.PathParameter("id", InputPrimitiveType.String, isRequired: true);
            var headerParam = InputFactory.HeaderParameter("x-custom-header", InputPrimitiveType.String, isRequired: true);
            headerParam.Update(methodParameterSegments:
            [
                InputFactory.MethodParameter("request", requestModel, isRequired: true, location: InputRequestLocation.Body),
                InputFactory.MethodParameter("x-custom-header", InputPrimitiveType.String, isRequired: true)
            ]);
            var optionalQueryParam = InputFactory.QueryParameter("queryParam", InputPrimitiveType.Int32, isRequired: false);
            optionalQueryParam.Update(methodParameterSegments:
            [
                InputFactory.MethodParameter("request", requestModel, isRequired: true, location: InputRequestLocation.Body),
                InputFactory.MethodParameter("queryParam", InputPrimitiveType.Int32, isRequired: false)
            ]);
            var optionalFilter = InputFactory.QueryParameter("filter", InputPrimitiveType.String, isRequired: false);
            var bodyParam = InputFactory.BodyParameter("body", requestModel, isRequired: true);
            var optionalTake = InputFactory.QueryParameter("take", InputPrimitiveType.Int32, isRequired: false);

            var serviceMethod = InputFactory.BasicServiceMethod(
                "TestOp",
                InputFactory.Operation(
                    "TestOp",
                    parameters: [idParam, headerParam, optionalQueryParam, optionalFilter, bodyParam, optionalTake],
                    responses: [InputFactory.OperationResponse([200])]),
                parameters:
                [
                    InputFactory.MethodParameter("id", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Path),
                    InputFactory.MethodParameter("request", requestModel, isRequired: true, location: InputRequestLocation.Body),
                ]);

            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            await MockHelpers.LoadMockGeneratorAsync(clients: () => [inputClient], inputModels: () => [requestModel]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);

            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client!);
            Assert.IsNotNull(methodCollection);

            var convenienceMethod = methodCollection.FirstOrDefault(m
                => m.Signature.Parameters.All(p => p.Name != "options")
                   && m.Signature.Name == "TestOp");
            Assert.IsNotNull(convenienceMethod);

            var methodBody = convenienceMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), methodBody);
        }
    }
}
