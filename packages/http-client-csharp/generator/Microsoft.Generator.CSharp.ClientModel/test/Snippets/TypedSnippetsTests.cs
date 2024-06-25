// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    public class TypedSnippetsTests
    {
        [Test]
        public void JsonSerializerSnippet_Serialize()
        {
            var writerParam = new ParameterProvider("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
            var writer = new Utf8JsonWriterSnippet(writerParam);
            var jsonDocVar = new VariableExpression(typeof(JsonDocument), "jsonDocument");
            InvokeStaticMethodExpression result = JsonSerializerSnippet.Serialize(writer, new JsonDocumentSnippet(jsonDocVar).RootElement);

            Assert.IsNotNull(result.MethodType);
            Assert.AreEqual(new CSharpType(typeof(JsonSerializer)), result.MethodType);
            Assert.AreEqual(nameof(JsonSerializer.Serialize), result.MethodName);

        }

        [Test]
        public void JsonSerializerSnippet_Deserialize()
        {
            var readerParam = new ParameterProvider("reader", $"The JSON reader.", typeof(Utf8JsonWriter));
            var reader = new Utf8JsonWriterSnippet(readerParam);
            var jsonDocVar = new VariableExpression(typeof(JsonDocument), "jsonDocument");
            var element = new JsonElementSnippet(ScmKnownParameters.JsonElement);
            InvokeStaticMethodExpression result = JsonSerializerSnippet.Deserialize(element, typeof(object));

            Assert.IsNotNull(result.MethodType);
            Assert.AreEqual(new CSharpType(typeof(JsonSerializer)), result.MethodType);
            Assert.AreEqual(nameof(JsonSerializer.Deserialize), result.MethodName);

        }

        [TestCase(false)]
        [TestCase(true)]
        public void BinaryContentSnippet_InvokeStatic(bool withOptions)
        {
            var arg = Snippet.This;
            BinaryContentSnippet result;
            ModelReaderWriterOptionsSnippet? options = null;
            if (withOptions)
            {
                options = new ModelReaderWriterOptionsSnippet(new MemberExpression(null, "w"));
            }

            result = options != null ? BinaryContentSnippet.Create(arg, options) : BinaryContentSnippet.Create(arg);

            Assert.IsNotNull(result);
            var untyped = result.Untyped as InvokeStaticMethodExpression;
            Assert.IsNotNull(untyped);
            Assert.AreEqual(new CSharpType(typeof(BinaryContent)), untyped?.MethodType);
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

        //[Test]
        //public void OptionalSnippet_IsCollectionDefined()
        //{
        //    var member = new StringSnippet(new MemberExpression(null, "collection"));

        //    var result = OptionalSnippet.IsCollectionDefined(member);

        //    Assert.IsNotNull(result);
        //    var untyped = result.Untyped;
        //    Assert.IsNotNull(untyped);
        //}
    }
}
