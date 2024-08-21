// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class RestClientProviderTests
    {
        private static readonly InputModelType _spreadModel = InputFactory.Model(
            "spreadModel",
            usage: InputModelTypeUsage.Spread,
            properties:
            [
                InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("optionalProp", InputPrimitiveType.String, isRequired: false)
            ]);

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
            var specialHeaderParamCount = inputOperation.Parameters.Count(p => p.Location == RequestLocation.Header);
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

        [TestCaseSource(nameof(GetMethodParametersTestCases))]
        public void TestGetMethodParameters(InputOperation inputOperation)
        {
            var methodParameters = RestClientProvider.GetMethodParameters(inputOperation);

            Assert.IsTrue(methodParameters.Count > 0);

            if (inputOperation.Parameters.Any(p => p.Location == RequestLocation.Header))
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
                // validate optional parameter
                Assert.AreEqual(_spreadModel.Properties[1].Name, methodParameters[2].Name);
                Assert.AreEqual(Snippet.Default, methodParameters[2].DefaultValue);
            }
        }

        [TestCase]
        public void TestGetMethodParameters_ProperOrdering()
        {
            var methodParameters = RestClientProvider.GetMethodParameters(OperationWithMixedParamOrdering);

            Assert.AreEqual(OperationWithMixedParamOrdering.Parameters.Count, methodParameters.Count);

            // validate ordering
            Assert.AreEqual("requiredPath", methodParameters[0].Name);
            Assert.AreEqual("requiredQuery", methodParameters[1].Name);
            Assert.AreEqual("requiredHeader", methodParameters[2].Name);
            Assert.AreEqual("body", methodParameters[3].Name);
            Assert.AreEqual("contentType", methodParameters[4].Name);
            Assert.AreEqual("optionalQuery", methodParameters[5].Name);
            Assert.AreEqual("optionalHeader", methodParameters[6].Name);

            var orderedPathParams = RestClientProvider.GetMethodParameters(OperationWithOnlyPathParams);
            Assert.AreEqual(OperationWithOnlyPathParams.Parameters.Count, orderedPathParams.Count);
            Assert.AreEqual("c", orderedPathParams[0].Name);
            Assert.AreEqual("a", orderedPathParams[1].Name);
            Assert.AreEqual("b", orderedPathParams[2].Name);
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

        private readonly static InputOperation BasicOperation = InputFactory.Operation(
            "CreateMessage",
            parameters:
            [
                InputFactory.Parameter(
                    "repeatabilityFirstSent",
                    new InputDateTimeType(DateTimeKnownEncoding.Rfc7231, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String),
                    nameInRequest: "repeatability-first-sent",
                    location: RequestLocation.Header,
                    isRequired: false),
                InputFactory.Parameter(
                    "repeatabilityRequestId",
                    InputPrimitiveType.String,
                    nameInRequest: "repeatability-request-ID",
                    location: RequestLocation.Header,
                    isRequired: false),
                InputFactory.Parameter("message", InputPrimitiveType.Boolean, isRequired: true)
            ]);

        private readonly static InputOperation OperationWithSpreadParam = InputFactory.Operation(
            "CreateMessageWithSpread",
            parameters:
            [
                InputFactory.Parameter(
                    "spread",
                    _spreadModel,
                    location: RequestLocation.Body,
                    isRequired: true,
                    kind: InputOperationParameterKind.Spread),
                InputFactory.Parameter(
                    "p2",
                    InputPrimitiveType.Boolean,
                    location: RequestLocation.Path,
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
                    location: RequestLocation.Query,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                // optional query param
                InputFactory.Parameter(
                    "optionalQuery",
                    InputPrimitiveType.String,
                    location: RequestLocation.Query,
                    isRequired: false,
                    kind: InputOperationParameterKind.Method),
                // required path param
                InputFactory.Parameter(
                    "requiredPath",
                    InputPrimitiveType.String,
                    location: RequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                // required header param
                InputFactory.Parameter(
                    "requiredHeader",
                    InputPrimitiveType.String,
                    location: RequestLocation.Header,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                // optional header param
                InputFactory.Parameter(
                    "optionalHeader",
                    InputPrimitiveType.String,
                    location: RequestLocation.Header,
                    isRequired: false,
                    kind: InputOperationParameterKind.Method),
                // content type param
                InputFactory.Parameter(
                    "contentType",
                    InputPrimitiveType.String,
                    location: RequestLocation.Header,
                    isContentType: true,
                    kind: InputOperationParameterKind.Method),
                // body param
                InputFactory.Parameter(
                    "body",
                    InputPrimitiveType.String,
                    location: RequestLocation.Body,
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
                    location: RequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                InputFactory.Parameter(
                    "a",
                    InputPrimitiveType.String,
                    location: RequestLocation.Path,
                    isRequired: true,
                    kind: InputOperationParameterKind.Method),
                InputFactory.Parameter(
                    "b",
                    InputPrimitiveType.String,
                    location: RequestLocation.Path,
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

        private static IEnumerable<TestCaseData> GetSpreadParameterModelTestCases =>
        [
            // spread param
            new TestCaseData(InputFactory.Parameter("spread", _spreadModel, location: RequestLocation.Body, kind: InputOperationParameterKind.Spread, isRequired: true)),
            // non spread param
            new TestCaseData(InputFactory.Parameter("p1", InputPrimitiveType.Boolean, location: RequestLocation.Path, isRequired: true, kind: InputOperationParameterKind.Method))

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
    }
}
