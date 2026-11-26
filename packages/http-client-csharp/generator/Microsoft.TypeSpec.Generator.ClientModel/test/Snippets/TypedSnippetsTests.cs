// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    public class TypedSnippetsTests
    {
        public TypedSnippetsTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void WriteBinaryDataUsesConfiguredJsonDocumentOptions()
        {
            var writer = new ParameterProvider("writer", $"The JSON writer.", typeof(Utf8JsonWriter)).As<Utf8JsonWriter>();
            var value = new VariableExpression(typeof(BinaryData), "value");

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.WriteBinaryData(value).ToDisplayString());
        }

        [TestCase(32)]
        [TestCase(80)]
        public void WriteBinaryDataNetStandardFallbackRoundTripsNestedJson(int depth)
        {
            var json = new string('[', depth) + "0" + new string(']', depth);

            Assert.AreEqual(json, CompileBinaryDataWriter()(json));
        }

        [Test]
        public void WriteBinaryDataNetStandardFallbackPreservesDepthLimit()
        {
            var write = CompileBinaryDataWriter();
            var json = new string('[', 257) + "0" + new string(']', 257);

            Assert.Catch<JsonException>(() => write(json));
        }

        private static Func<string, string> CompileBinaryDataWriter()
        {
            var writer = new VariableExpression(typeof(Utf8JsonWriter), "writer").As<Utf8JsonWriter>();
            var value = new VariableExpression(typeof(BinaryData), "value");
            var options = new ModelSerializationExtensionsDefinition().Fields.Single(field => field.Name == "JsonDocumentOptions").InitializationValue!;
            var source = Helpers.GetExpectedFromFile()
                .Replace("/* json document options */", options.ToDisplayString())
                .Replace("/* write binary data */", writer.WriteBinaryData(value).ToDisplayString());
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(BinaryData).Assembly.Location)
                .Distinct()
                .Select(path => MetadataReference.CreateFromFile(path));
            var compilation = CSharpCompilation.Create(
                "BinaryDataWriter" + Guid.NewGuid().ToString("N"),
                [CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(preprocessorSymbols: ["NETSTANDARD2_0"]))],
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.IsTrue(result.Success, string.Join(Environment.NewLine, result.Diagnostics));

            var method = Assembly.Load(stream.ToArray()).GetType("Sample.BinaryDataWriter")!.GetMethod("Write")!;
            return (Func<string, string>)method.CreateDelegate(typeof(Func<string, string>));
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
            CollectionAssert.AreEqual(new ValueExpression[] { member }, invoke!.Arguments);
        }

        [Test]
        public void OptionalSnippet_IsDefinedWithPresence()
        {
            var member = new MemberExpression(null, "mock").As<string>();
            var presence = new MemberExpression(null, "_mockIsDefined").As<bool>();

            var result = OptionalSnippets.IsDefined(member, presence);
            var invoke = result.Original as InvokeMethodExpression;

            Assert.IsNotNull(invoke);
            Assert.AreEqual("IsDefined", invoke!.MethodName);
            CollectionAssert.AreEqual(new ValueExpression[] { member, presence }, invoke.Arguments);
        }
    }
}
