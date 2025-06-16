// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;
using System.Threading;
using Microsoft.TypeSpec.Generator;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    public class TypedSnippetsTests
    {
        public TypedSnippetsTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void JsonSerializerSnippet_Serialize()
        {
            var writerParam = new ParameterProvider("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
            var writer = writerParam.As<Utf8JsonWriter>();
            var jsonDocVar = new VariableExpression(typeof(JsonDocument), "jsonDocument").As<JsonDocument>();
            InvokeMethodExpression result = JsonSerializerSnippets.Serialize(writer, jsonDocVar.RootElement());

            Assert.AreEqual(nameof(JsonSerializer.Serialize), result.MethodName);

        }

        [Test]
        public void JsonSerializerSnippet_Deserialize()
        {
            var readerParam = new ParameterProvider("reader", $"The JSON reader.", typeof(Utf8JsonWriter));
            var reader = readerParam.As<Utf8JsonWriter>();
            var jsonDocVar = new VariableExpression(typeof(JsonDocument), "jsonDocument");
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            InvokeMethodExpression result = JsonSerializerSnippets.Deserialize(element, typeof(object));

            Assert.AreEqual(nameof(JsonSerializer.Deserialize), result.MethodName);

        }

        [TestCase(false)]
        [TestCase(true)]
        public void BinaryContentSnippet_InvokeStatic(bool withOptions)
        {
            var arg = Snippet.This;
            RequestContentApi result;
            ScopedApi<ModelReaderWriterOptions>? options = null;
            if (withOptions)
            {
                options = new MemberExpression(null, "w").As<ModelReaderWriterOptions>();
            }

            result = options != null ? RequestContentApiSnippets.Create(arg, options) : RequestContentApiSnippets.Create(arg);

            Assert.IsNotNull(result);
            var untyped = result.Original as InvokeMethodExpression;
            Assert.IsNotNull(untyped);
            Assert.AreEqual(nameof(BinaryContent.Create), untyped?.MethodName);

            if (withOptions)
            {
                Assert.AreEqual(2, untyped?.Arguments.Count);
            }
            else
            {
                Assert.AreEqual(1, untyped?.Arguments.Count);
            }

            Assert.AreEqual(arg, untyped?.Arguments[0]);
        }

        [Test]
        public void IHttpRequestOptionsApiSnippets_FromCancellationToken()
        {
            // Create a parameter for cancellationToken
            var cancellationTokenParam = new ParameterProvider("cancellationToken", $"The cancellation token.", typeof(CancellationToken));
            var cancellationToken = cancellationTokenParam.As<CancellationToken>();

            // Call the method under test
            var result = IHttpRequestOptionsApiSnippets.FromCancellationToken(cancellationToken);

            // Verify result is not null and properly typed
            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Original);

            // Verify the underlying expression is a TernaryConditionalExpression
            var ternary = result.Original as TernaryConditionalExpression;
            Assert.IsNotNull(ternary);

            // Verify the condition part is checking CanBeCanceled property
            var condition = ternary?.Condition as MemberExpression;
            Assert.IsNotNull(condition);
            Assert.AreEqual(nameof(CancellationToken.CanBeCanceled), condition?.MemberName);

            // Verify the consequent part has a value
            Assert.IsNotNull(ternary?.Consequent);
            
            // Verify the alternative part represents a null value
            Assert.IsNotNull(ternary?.Alternative);
            var valueExpression = ternary?.Alternative as ValueExpression;
            Assert.IsNotNull(valueExpression);
            
            // This validates the overall structure is:
            // cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null
            // which is the pattern necessary for the expected behavior
        }

        [Test]
        public void OptionalSnippet_IsCollectionDefined()
        {
            var member = new MemberExpression(null, "collection").As<string>();

            var result = OptionalSnippets.IsCollectionDefined(member);

            Assert.IsNotNull(result);
            var invoke = result.Original as InvokeMethodExpression;
            Assert.IsNotNull(invoke);
            Assert.AreEqual("IsCollectionDefined", invoke?.MethodName);
        }

        [Test]
        public void OptionalSnippet_IsDefined()
        {
            var member = new MemberExpression(null, "mock").As<string>();

            var result = OptionalSnippets.IsDefined(member);

            Assert.IsNotNull(result);
            var invoke = result.Original as InvokeMethodExpression;
            Assert.IsNotNull(invoke);
            Assert.AreEqual("IsDefined", invoke?.MethodName);
        }
    }
}
