// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    public class TypedSnippetsTests
    {
        public TypedSnippetsTests()
        {
            MockHelpers.LoadMockPlugin();
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
