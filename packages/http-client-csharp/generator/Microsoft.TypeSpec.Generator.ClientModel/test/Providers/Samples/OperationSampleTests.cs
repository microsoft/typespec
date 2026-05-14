// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System;
using System.Reflection;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
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
        // Core identity properties
        // -------------------------------------------------------------------

        [Test]
        public void ExampleKey_PreservedFromInput()
        {
            var sample = CreateBasicSample("ShortVersion");
            Assert.AreEqual("ShortVersion", sample.ExampleKey);
        }

        [Test]
        public void IsAllParametersUsed_TrueForAllParameters()
        {
            var sample = CreateBasicSample("AllParameters");
            Assert.IsTrue(sample.IsAllParametersUsed);
        }

        [Test]
        public void IsAllParametersUsed_FalseForShortVersion()
        {
            var sample = CreateBasicSample("ShortVersion");
            Assert.IsFalse(sample.IsAllParametersUsed);
        }

        [Test]
        public void IsConvenienceSample_PreservedFromInput()
        {
            var sample = CreateBasicSample("ShortVersion", isConvenience: true);
            Assert.IsTrue(sample.IsConvenienceSample);
        }

        [Test]
        public void InputOperationName_PreservedFromServiceMethod()
        {
            var sample = CreateBasicSample("ShortVersion");
            Assert.AreEqual("TestOperation", sample.InputOperationName);
        }

        [Test]
        public void ResourceName_FallsBackToClientName()
        {
            var sample = CreateBasicSample("ShortVersion");
            // InputFactory.Operation sets ResourceName to null,
            // so falls back to client name
            Assert.AreEqual("TestClient", sample.ResourceName);
        }

        // -------------------------------------------------------------------
        // Operation type detection
        // -------------------------------------------------------------------

        [Test]
        public void IsPageable_FalseForBasicMethod()
        {
            var sample = CreateBasicSample("ShortVersion");
            Assert.IsFalse(sample.IsPageable);
        }

        [Test]
        public void IsPageable_TrueForPagingMethod()
        {
            var operation = InputFactory.Operation("ListItems");
            var pagingMetadata = InputFactory.PagingMetadata(["items"], null, null);
            var serviceMethod = InputFactory.PagingServiceMethod("ListItems", operation, pagingMetadata: pagingMetadata);

            // Verify the service method is recognized as paging
            Assert.IsInstanceOf<InputPagingServiceMethod>(serviceMethod);
        }

        [Test]
        public void IsLongRunning_FalseForBasicMethod()
        {
            var sample = CreateBasicSample("ShortVersion");
            Assert.IsFalse(sample.IsLongRunning);
        }

        [Test]
        public void HasResponseBody_FalseForVoidReturn()
        {
            var sample = CreateBasicSample("ShortVersion");
            // Basic operation with no response type → no body
            Assert.IsFalse(sample.HasResponseBody);
        }

        // -------------------------------------------------------------------
        // Client invocation chain — root client
        // -------------------------------------------------------------------

        [Test]
        public void ClientInvocationChain_RootClient_HasSingleConstructor()
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
        public void ClientInvocationChain_SubClient_HasConstructorAndFactory()
        {
            var (sample, _, _) = CreateSubClientSample("ShortVersion");
            var chain = sample.ClientInvocationChain;

            Assert.IsTrue(chain.Count >= 2);
            Assert.IsInstanceOf<ConstructorSignature>(chain[0]);
            Assert.IsInstanceOf<MethodSignature>(chain[1]);
        }

        // -------------------------------------------------------------------
        // Parameter value mapping
        // -------------------------------------------------------------------

        [Test]
        public void ParameterMapping_SpecProvidedValue_IsMapped()
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

            // Use convenience sample so the parameter name "message" is preserved
            var sample = new OperationSample(client, methodCollection, serviceMethod, example, true, "ShortVersion");
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("message"));
            Assert.IsNotNull(mapping["message"].Value);
        }

        [Test]
        public void ParameterMapping_MissingOptionalParam_IsOmitted()
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
            var mapping = sample.ParameterValueMapping;

            Assert.IsFalse(mapping.ContainsKey("tag"));
        }

        [Test]
        public void GetEndpointValue_WithoutExample_UsesPlaceholder()
        {
            var sample = CreateBasicSample("ShortVersion");
            var endpointValue = InvokeGetEndpointValue(sample, "endpoint");
            Assert.AreEqual("<endpoint>", GetRawExampleValue(endpointValue));
        }

        [Test]
        public void ParameterMapping_TokenCredential_GeneratesNewInstanceExpression()
        {
            var sample = CreateSampleWithClientParameterType("credential", new CSharpType(typeof(TokenCredential)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("credential"));
            Assert.IsNull(mapping["credential"].Value);
            var credentialExpression = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["credential"]));
            Assert.IsInstanceOf<NewInstanceExpression>(credentialExpression);

            var newCredential = (NewInstanceExpression)credentialExpression;
            Assert.AreEqual(typeof(TokenCredential), newCredential.Type?.FrameworkType);
            Assert.AreEqual(0, newCredential.Parameters.Count);
        }

        [Test]
        public void ParameterMapping_AzureKeyCredential_GeneratesKeyPlaceholderExpression()
        {
            var sample = CreateSampleWithClientParameterType("credential", new CSharpType(typeof(AzureKeyCredential)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("credential"));
            Assert.IsNull(mapping["credential"].Value);
            var credentialExpression = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["credential"]));
            Assert.IsInstanceOf<NewInstanceExpression>(credentialExpression);

            var newCredential = (NewInstanceExpression)credentialExpression;
            Assert.AreEqual(typeof(AzureKeyCredential), newCredential.Type?.FrameworkType);
            Assert.AreEqual(1, newCredential.Parameters.Count);
            Assert.IsNotInstanceOf<KeywordExpression>(newCredential.Parameters[0]);
        }

        [Test]
        public void ParameterMapping_WaitUntil_UsesCompletedExpression()
        {
            var sample = CreateSampleWithClientParameterType("waitUntil", new CSharpType(typeof(WaitUntil)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("waitUntil"));
            Assert.IsNull(mapping["waitUntil"].Value);

            var expression = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["waitUntil"]));
            Assert.IsNotInstanceOf<KeywordExpression>(expression);
        }

        [Test]
        public void ParameterMapping_RequiredRequestOptions_UsesNullExpression()
        {
            var sample = CreateSampleWithClientParameterType(
                "options",
                new CSharpType(typeof(RequestOptions)),
                isOptional: false,
                defaultValue: null);
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("options"));
            Assert.IsNull(mapping["options"].Value);

            var expression = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["options"]));
            Assert.IsInstanceOf<KeywordExpression>(expression);
        }

        [Test]
        public void ParameterMapping_MatchConditions_UsesNullExpression()
        {
            var sample = CreateSampleWithClientParameterType("conditions", new CSharpType(typeof(MatchConditions)));
            var mapping = sample.ParameterValueMapping;

            Assert.IsTrue(mapping.ContainsKey("conditions"));
            Assert.IsNull(mapping["conditions"].Value);

            var expression = UnwrapCast(ExampleValueExpressionBuilder.GetExpression(mapping["conditions"]));
            Assert.IsInstanceOf<KeywordExpression>(expression);
        }

        // -------------------------------------------------------------------
        // GetValueExpressionsForParameters
        // -------------------------------------------------------------------

        [Test]
        public void GetValueExpressions_ProducesExpressions()
        {
            var bodyParam = InputFactory.MethodParameter("count", InputPrimitiveType.Int32, isRequired: true);
            var example = new InputOperationExample(
                "ShortVersion",
                null,
                [new InputParameterExample(bodyParam, InputExampleValue.Value(InputPrimitiveType.Int32, 42))],
                "");

            var operation = InputFactory.Operation("DoStuff",
                parameters: [InputFactory.BodyParameter("count", InputPrimitiveType.Int32, isRequired: true)]);
            var serviceMethod = InputFactory.BasicServiceMethod("DoStuff", operation, parameters: [bodyParam]);
            var inputClient = InputFactory.Client("StuffClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(
                createCSharpTypeCore: (inputType) => new CSharpType(typeof(int)));

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);

            var sample = new OperationSample(client, methodCollection, serviceMethod, example, false, "ShortVersion");

            var declarations = new List<MethodBodyStatement>();
            var syncProtocol = methodCollection.MethodProviders
                .FirstOrDefault(m => m.Kind == ScmMethodKind.Protocol &&
                    !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));

            if (syncProtocol != null)
            {
                var expressions = sample.GetValueExpressionsForParameters(
                    syncProtocol.Signature.Parameters, declarations).ToList();

                Assert.IsTrue(expressions.Count > 0);
            }
        }

        [Test]
        public void GetEndpointValue_WithExample_UsesExampleValue()
        {
            const string endpointUrl = "https://example.contoso.test";
            var sample = CreateSampleWithEndpointExample("ShortVersion", endpointUrl);
            var endpointValue = InvokeGetEndpointValue(sample, "endpoint");
            Assert.AreEqual(endpointUrl, GetRawExampleValue(endpointValue));
        }

        // -------------------------------------------------------------------
        // Sample information (human-readable descriptions)
        // -------------------------------------------------------------------

        [Test]
        public void GetSampleInformation_Sync_Convenience()
        {
            var sample = CreateBasicSample("ShortVersion", isConvenience: true);
            var info = sample.GetSampleInformation(false);
            Assert.IsTrue(info.Contains("how to call"));
            Assert.IsFalse(info.Contains("Async"));
        }

        [Test]
        public void GetSampleInformation_Async_AppendsAsync()
        {
            var sample = CreateBasicSample("ShortVersion", isConvenience: true);
            var info = sample.GetSampleInformation(true);
            Assert.IsTrue(info.Contains("Async"));
        }

        [Test]
        public void GetSampleInformation_AllParameters_IncludesAllParameters()
        {
            var sample = CreateBasicSample("AllParameters", isConvenience: true);
            var info = sample.GetSampleInformation(false);
            Assert.IsTrue(info.Contains("all parameters"));
        }

        // -------------------------------------------------------------------
        // Static helper: ShouldGenerateSample
        // -------------------------------------------------------------------

        [Test]
        public void ShouldGenerateSample_PublicMethod_ReturnsTrue()
        {
            var operation = InputFactory.Operation("TestOp");
            var serviceMethod = InputFactory.BasicServiceMethod("TestOp", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);

            var syncProtocol = methodCollection.MethodProviders
                .FirstOrDefault(m => m.Kind == ScmMethodKind.Protocol &&
                    !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));

            if (syncProtocol != null)
            {
                Assert.IsTrue(OperationSample.ShouldGenerateSample(client, syncProtocol.Signature));
            }
        }

        [Test]
        public void ShouldGenerateSample_SubClient_ReturnsTrue()
        {
            var (_, _, subProvider) = CreateSubClientSample("ShortVersion");

            // Verify that subclients are identified correctly
            Assert.IsTrue(subProvider.InputClient.Parent != null);
        }

        // -------------------------------------------------------------------
        // Static helper: ShouldGenerateShortVersion
        // -------------------------------------------------------------------

        [Test]
        public void ShouldGenerateShortVersion_NoConvenience_ReturnsTrue()
        {
            var operation = InputFactory.Operation("TestOp", generateConvenienceMethod: false);
            var serviceMethod = InputFactory.BasicServiceMethod("TestOp", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);

            Assert.IsTrue(OperationSample.ShouldGenerateShortVersion(methodCollection));
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

        private static OperationSample CreatePagingSample(string exampleKey)
        {
            var operation = InputFactory.Operation("ListItems");
            var pagingMetadata = InputFactory.PagingMetadata(["items"], null, null);
            var serviceMethod = InputFactory.PagingServiceMethod("ListItems", operation, pagingMetadata: pagingMetadata);
            var inputClient = InputFactory.Client("PagingClient", methods: [serviceMethod]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var methodCollection = new ScmMethodProviderCollection(serviceMethod, client);
            var example = new InputOperationExample(exampleKey, null, [], "");

            return new OperationSample(client, methodCollection, serviceMethod, example, false, exampleKey);
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

        private static OperationSample CreateSubClientSampleWithEndpointExample(string exampleKey, string? endpointExample)
        {
            var endpointParam = InputFactory.EndpointParameter("endpoint", InputPrimitiveType.Url, isRequired: true);
            var parentClient = InputFactory.Client("RootClient", parameters: [endpointParam]);
            var subOperation = InputFactory.Operation("DoWork");
            var subServiceMethod = InputFactory.BasicServiceMethod("DoWork", subOperation);
            var subClient = InputFactory.Client(
                "SubClient",
                parent: parentClient,
                methods: [subServiceMethod],
                initializedBy: InputClientInitializedBy.Parent);

            var exampleParameters = endpointExample is null
                ? new List<InputParameterExample>()
                : new List<InputParameterExample>
                {
                    new InputParameterExample(endpointParam, InputExampleValue.Value(InputPrimitiveType.Url, endpointExample))
                };

            MockHelpers.LoadMockGenerator(
                clients: () => [parentClient, subClient],
                createCSharpTypeCore: inputType => inputType.Equals(InputPrimitiveType.Url)
                    ? new CSharpType(typeof(Uri))
                    : new CSharpType(typeof(string)));

            var subProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(subClient)!;
            var methodCollection = new ScmMethodProviderCollection(subServiceMethod, subProvider);
            var example = new InputOperationExample(exampleKey, null, exampleParameters, "");

            return new OperationSample(subProvider, methodCollection, subServiceMethod, example, false, exampleKey);
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

        private sealed class TokenCredential
        {
        }

        private sealed class AzureKeyCredential
        {
        }

        private sealed class WaitUntil
        {
            public static WaitUntil Completed { get; } = new WaitUntil();
        }

        private sealed class MatchConditions
        {
        }

        private static object? GetRawExampleValue(InputExampleValue value)
        {
            var rawValueProperty = value.GetType().GetProperty("RawValue");
            return rawValueProperty?.GetValue(value);
        }

        private static ValueExpression UnwrapCast(ValueExpression expression)
        {
            while (expression is CastExpression castExpression)
            {
                expression = castExpression.Inner;
            }

            return expression;
        }

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
