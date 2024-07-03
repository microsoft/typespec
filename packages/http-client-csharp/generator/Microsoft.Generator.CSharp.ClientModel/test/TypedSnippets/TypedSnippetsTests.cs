// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    public class TypedSnippetsTests
    {
        private readonly string _mocksFolder = "Mocks";
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            var mockTypeFactory = new Mock<ScmTypeFactory>() { };
            mockTypeFactory.Setup(t => t.ListInitializationType).Returns(new CSharpType(typeof(IList<>)));
            mockTypeFactory.Setup(t => t.DictionaryInitializationType).Returns(new CSharpType(typeof(IDictionary<,>)));
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object[] parameters = new object[] { configFilePath, null! };
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            _mockPlugin?.SetValue(null, mockPluginInstance.Object);
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        [Test]
        public void JsonSerializerSnippet_Serialize()
        {
            var writerParam = new ParameterProvider("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
            var writer = new Utf8JsonWriterSnippet(writerParam);
            var jsonDocVar = new VariableExpression(typeof(JsonDocument), "jsonDocument").As<JsonDocument>();
            InvokeInstanceMethodExpression result = JsonSerializerSnippets.Serialize(writer, jsonDocVar.RootElement());

            Assert.AreEqual(nameof(JsonSerializer.Serialize), result.MethodName);

        }

        [Test]
        public void JsonSerializerSnippet_Deserialize()
        {
            var readerParam = new ParameterProvider("reader", $"The JSON reader.", typeof(Utf8JsonWriter));
            var reader = new Utf8JsonWriterSnippet(readerParam);
            var jsonDocVar = new VariableExpression(typeof(JsonDocument), "jsonDocument");
            var element = ScmKnownParameters.JsonElement.As<JsonElement>();
            InvokeInstanceMethodExpression result = JsonSerializerSnippets.Deserialize(element, typeof(object));

            Assert.AreEqual(nameof(JsonSerializer.Deserialize), result.MethodName);

        }

        [TestCase(false)]
        [TestCase(true)]
        public void BinaryContentSnippet_InvokeStatic(bool withOptions)
        {
            var arg = Snippet.This;
            ScopedApi<BinaryContent> result;
            ModelReaderWriterOptionsSnippet? options = null;
            if (withOptions)
            {
                options = new ModelReaderWriterOptionsSnippet(new MemberExpression(null, "w"));
            }

            result = options != null ? BinaryContentSnippets.Create(arg, options) : BinaryContentSnippets.Create(arg);

            Assert.IsNotNull(result);
            var untyped = result.Original as InvokeInstanceMethodExpression;
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

            var result = OptionalSnippet.IsCollectionDefined(member);

            Assert.IsNotNull(result);
            var invoke = result.Original as InvokeInstanceMethodExpression;
            Assert.IsNotNull(invoke);
            Assert.AreEqual("IsCollectionDefined", invoke?.MethodName);
        }

        [Test]
        public void OptionalSnippet_IsDefined()
        {
            var member = new MemberExpression(null, "mock").As<string>();

            var result = OptionalSnippet.IsDefined(member);

            Assert.IsNotNull(result);
            var invoke = result.Original as InvokeInstanceMethodExpression;
            Assert.IsNotNull(invoke);
            Assert.AreEqual("IsDefined", invoke?.MethodName);
        }
    }
}
