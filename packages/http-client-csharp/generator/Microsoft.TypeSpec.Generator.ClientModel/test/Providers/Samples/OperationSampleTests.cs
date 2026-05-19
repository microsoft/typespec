// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System;
using System.Reflection;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Samples
{
    public class OperationSampleTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        // -------------------------------------------------------------------
        // TokenCredential → new DefaultAzureCredential()
        // -------------------------------------------------------------------

        [Test]
        public void TokenCredential_ProducesDefaultAzureCredential()
        {
            var sample = CreateSampleWithClientParameterType("credential", new CSharpType(typeof(TokenCredential)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("credential"));

            // The expression should be a FormattableStringExpression containing "new DefaultAzureCredential()"
            // (not "new TokenCredential()" which would fail because TokenCredential is abstract)
            var expr = ExampleValueExpressionBuilder.GetExpression(mapping["credential"]);
            Assert.IsInstanceOf<FormattableStringExpression>(expr);

            // Verify the format string is exactly "new DefaultAzureCredential()" via reflection
            // (Format is private, but this is the key parity assertion)
            var formatProp = typeof(FormattableStringExpression).GetProperty("Format", BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.IsNotNull(formatProp, "Format property should exist on FormattableStringExpression");
            Assert.AreEqual("new DefaultAzureCredential()", formatProp!.GetValue(expr));
        }

        // -------------------------------------------------------------------
        // ApiKeyCredential → new AzureKeyCredential("<key>")
        // -------------------------------------------------------------------

        [Test]
        public void ApiKeyCredential_ProducesNewWithKeyPlaceholder()
        {
            var sample = CreateSampleWithClientParameterType("credential", new CSharpType(typeof(AzureKeyCredential)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("credential"));

            var expr = Unwrap(UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["credential"])));
            Assert.IsInstanceOf<NewInstanceExpression>(expr);

            var newExpr = (NewInstanceExpression)expr;
            Assert.AreEqual(1, newExpr.Parameters.Count);
            // The argument should be the literal "<key>"
            var argExpr = Unwrap(newExpr.Parameters[0]);
            Assert.IsInstanceOf<LiteralExpression>(argExpr);
            Assert.AreEqual("<key>", ((LiteralExpression)argExpr).Literal);
        }

        // -------------------------------------------------------------------
        // Endpoint value resolution
        // -------------------------------------------------------------------

        [Test]
        public void Endpoint_WithoutExample_UsesPlaceholder()
        {
            var sample = CreateBasicSample("ShortVersion");
            var endpointValue = InvokeGetEndpointValue(sample, "endpoint");
            Assert.AreEqual("<endpoint>", GetRawExampleValue(endpointValue));
        }

        [Test]
        public void Endpoint_WithExample_UsesProvidedUrl()
        {
            const string url = "https://example.contoso.test";
            var sample = CreateSampleWithEndpointExample("ShortVersion", url);
            var endpointValue = InvokeGetEndpointValue(sample, "endpoint");
            Assert.AreEqual(url, GetRawExampleValue(endpointValue));
        }

        // -------------------------------------------------------------------
        // Client invocation chain — root client
        // -------------------------------------------------------------------

        [Test]
        public void RootClient_ChainHasConstructor()
        {
            var sample = CreateBasicSample("ShortVersion");
            var chain = sample.ClientInvocationChain;

            Assert.IsTrue(chain.Count >= 1);
            Assert.IsInstanceOf<ConstructorSignature>(chain[0]);
        }

        // -------------------------------------------------------------------
        // Client invocation chain — subclient
        // -------------------------------------------------------------------

        [Test]
        public void SubClient_ChainHasConstructorThenFactory()
        {
            var (sample, _, _) = CreateSubClientSample("ShortVersion");
            var chain = sample.ClientInvocationChain;

            Assert.IsTrue(chain.Count >= 2);
            Assert.IsInstanceOf<ConstructorSignature>(chain[0], "First element should be root ctor");
            Assert.IsInstanceOf<MethodSignature>(chain[1], "Second element should be factory method");
        }

        // -------------------------------------------------------------------
        // Parameter mapping
        // -------------------------------------------------------------------

        [Test]
        public void ParameterMapping_ExampleValue_IsMapped()
        {
            var bodyParam = InputFactory.MethodParameter("message", InputPrimitiveType.String, isRequired: true);
            var example = new InputOperationExample(
                "ShortVersion",
                null,
                [new InputParameterExample(bodyParam, InputExampleValue.Value(InputPrimitiveType.String, "hello"))],
                "");

            var operation = InputFactory.Operation("SendMessage",
                parameters: [InputFactory.BodyParameter("message", InputPrimitiveType.String, isRequired: true)]);
            var serviceMethod = InputFactory.BasicServiceMethod("SendMessage", operation, parameters: [bodyParam]);
            var inputClient = InputFactory.Client("MsgClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(string)));

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);
            var sample = new OperationSample(client, methodCollection, serviceMethod, example, true, "ShortVersion");

            var mapping = sample.ParameterValueMapping;
            Assert.IsTrue(mapping.ContainsKey("message"));
            Assert.IsNotNull(mapping["message"].Value);
        }

        // -------------------------------------------------------------------
        // Optional params excluded from ShortVersion
        // -------------------------------------------------------------------

        [Test]
        public void ParameterMapping_OptionalParam_ExcludedFromShortVersion()
        {
            var optionalParam = InputFactory.MethodParameter("tag", InputPrimitiveType.String, isRequired: false,
                defaultValue: InputFactory.Constant.String("default"));
            var example = new InputOperationExample("ShortVersion", null, [], "");

            var operation = InputFactory.Operation("GetItem",
                parameters: [InputFactory.QueryParameter("tag", InputPrimitiveType.String, isRequired: false)]);
            var serviceMethod = InputFactory.BasicServiceMethod("GetItem", operation, parameters: [optionalParam]);
            var inputClient = InputFactory.Client("ItemClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(string)));

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);
            var sample = new OperationSample(client, methodCollection, serviceMethod, example, true, "ShortVersion");

            Assert.IsFalse(sample.ParameterValueMapping.ContainsKey("tag"));
        }

        // -------------------------------------------------------------------
        // WaitUntil → .Completed
        // -------------------------------------------------------------------

        [Test]
        public void WaitUntil_ProducesCompletedMemberAccess()
        {
            var sample = CreateSampleWithClientParameterType("waitUntil", new CSharpType(typeof(WaitUntil)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("waitUntil"));
            var expr = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["waitUntil"]));
            // Should be a property access like WaitUntil.Completed
            Assert.IsInstanceOf<MemberExpression>(expr);
        }

        // -------------------------------------------------------------------
        // RequestOptions (required) → null
        // -------------------------------------------------------------------

        [Test]
        public void RequiredRequestOptions_ProducesNull()
        {
            var sample = CreateSampleWithClientParameterType(
                "options",
                new CSharpType(typeof(System.ClientModel.Primitives.RequestOptions)),
                isOptional: false,
                defaultValue: null);
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("options"));
            var expr = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["options"]));
            Assert.IsInstanceOf<KeywordExpression>(expr);
        }

        // -------------------------------------------------------------------
        // MatchConditions → null
        // -------------------------------------------------------------------

        [Test]
        public void MatchConditions_ProducesNull()
        {
            var sample = CreateSampleWithClientParameterType("conditions", new CSharpType(typeof(MatchConditions)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("conditions"));
            var expr = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["conditions"]));
            Assert.IsInstanceOf<KeywordExpression>(expr);
        }

        // -------------------------------------------------------------------
        // ShouldGenerateShortVersion
        // -------------------------------------------------------------------

        [Test]
        public void ShouldGenerateShortVersion_TrueWhenNoConvenience()
        {
            var operation = InputFactory.Operation("TestOp", generateConvenienceMethod: false);
            var serviceMethod = InputFactory.BasicServiceMethod("TestOp", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);

            Assert.IsTrue(OperationSample.ShouldGenerateShortVersion(methodCollection));
        }

        // -------------------------------------------------------------------
        // Sample metadata
        // -------------------------------------------------------------------

        [Test]
        public void SampleInformation_ContainsMethodName()
        {
            var sample = CreateBasicSample("ShortVersion", isConvenience: true);
            var info = sample.GetSampleInformation(false);
            Assert.IsTrue(info.Contains("how to call"));
        }

        [Test]
        public void SampleInformation_AsyncAppendsAsync()
        {
            var sample = CreateBasicSample("ShortVersion", isConvenience: true);
            var info = sample.GetSampleInformation(true);
            Assert.IsTrue(info.Contains("Async"));
        }

        // -------------------------------------------------------------------
        // Helpers
        // -------------------------------------------------------------------

        private static OperationSample CreateBasicSample(string exampleKey, bool isConvenience = false)
        {
            var operation = InputFactory.Operation("TestOperation");
            var serviceMethod = InputFactory.BasicServiceMethod("TestOperation", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);
            var example = new InputOperationExample(exampleKey, null, [], "");

            return new OperationSample(client, methodCollection, serviceMethod, example, isConvenience, exampleKey);
        }

        private static (OperationSample sample, ClientProvider rootClient, ClientProvider subClient) CreateSubClientSample(string exampleKey)
        {
            var endpointParam = InputFactory.EndpointParameter("endpoint", InputPrimitiveType.Url, isRequired: true);
            var parentClient = InputFactory.Client("RootClient", parameters: [endpointParam]);
            var subOperation = InputFactory.Operation("DoWork");
            var subServiceMethod = InputFactory.BasicServiceMethod("DoWork", subOperation);
            var subClient = InputFactory.Client("SubClient", parent: parentClient,
                methods: [subServiceMethod],
                initializedBy: InputClientInitializedBy.Parent);

            MockHelpers.LoadMockGenerator(clients: () => [parentClient, subClient]);

            var rootProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(parentClient)!;
            var subProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(subClient)!;
            var methodCollection = new ScmMethodProviderCollection(subServiceMethod, subProvider);
            var example = new InputOperationExample(exampleKey, null, [], "");

            var sample = new OperationSample(subProvider, methodCollection, subServiceMethod, example, false, exampleKey);
            return (sample, rootProvider, subProvider);
        }

        private static OperationSample CreateSampleWithEndpointExample(string exampleKey, string endpointExample)
        {
            var endpointParam = InputFactory.EndpointParameter("endpoint", InputPrimitiveType.Url, isRequired: true);
            var operation = InputFactory.Operation("TestOperation");
            var serviceMethod = InputFactory.BasicServiceMethod("TestOperation", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator();

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);
            var example = new InputOperationExample(
                exampleKey,
                null,
                [new InputParameterExample(endpointParam, InputExampleValue.Value(InputPrimitiveType.Url, endpointExample))],
                "");

            return new OperationSample(client, methodCollection, serviceMethod, example, false, exampleKey);
        }

        private static OperationSample CreateSampleWithClientParameterType(
            string parameterName,
            CSharpType mappedType,
            bool isOptional = false,
            InputConstant? defaultValue = null)
        {
            var clientParameter = InputFactory.QueryParameter(
                parameterName,
                InputPrimitiveType.String,
                isRequired: !isOptional,
                defaultValue: defaultValue);
            var operation = InputFactory.Operation("DoWork");
            var serviceMethod = InputFactory.BasicServiceMethod("DoWork", operation);
            var inputClient = InputFactory.Client("TypedClient", parameters: [clientParameter], methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(
                clients: () => [inputClient],
                createCSharpTypeCore: _ => mappedType);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);
            var example = new InputOperationExample("ShortVersion", null, [], "");

            return new OperationSample(client, methodCollection, serviceMethod, example, false, "ShortVersion");
        }

        // Stub types for credential/LRO tests (matched by type name in TryProcessKnownParameter)
        private sealed class TokenCredential { }
        private sealed class AzureKeyCredential { }
        private sealed class WaitUntil
        {
            public static WaitUntil Completed { get; } = new WaitUntil();
        }
        private sealed class MatchConditions { }

        private static object? GetRawExampleValue(InputExampleValue value)
        {
            var rawValueProperty = value.GetType().GetProperty("RawValue");
            return rawValueProperty?.GetValue(value);
        }

        private static ValueExpression UnwrapCast(ValueExpression expression)
        {
            while (expression is CastExpression castExpression)
                expression = castExpression.Inner;
            return expression;
        }

        /// <summary>Unwrap ScopedApi wrappers to get the underlying expression.</summary>
        private static ValueExpression Unwrap(ValueExpression expr)
            => expr is ScopedApi scoped ? scoped.Original : expr;

        private static InputExampleValue InvokeGetEndpointValue(OperationSample sample, string parameterName)
        {
            var method = typeof(OperationSample).GetMethod("GetEndpointValue", BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.IsNotNull(method);
            var value = method!.Invoke(sample, [parameterName]);
            Assert.IsNotNull(value);
            return (InputExampleValue)value!;
        }
    }
}
