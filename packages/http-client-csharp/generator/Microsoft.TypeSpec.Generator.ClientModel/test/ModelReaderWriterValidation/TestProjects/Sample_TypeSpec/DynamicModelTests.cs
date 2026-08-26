// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using SampleTypeSpec;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class DynamicModelTests
    {
        [Test]
        public void ModelReaderWriterWrite_DoesNotDuplicatePatchedRequiredRootCollection()
        {
            var model = SampleTypeSpecModelFactory.DynamicModel(
                name: "dynamic-model",
                foo: new AnotherDynamicModel("bar"));

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            model.Patch.Set("$.requiredNullableList"u8, "[1,2]"u8);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            var data = ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default);
            var json = data.ToString();

            using var document = JsonDocument.Parse(json);
            Assert.That(GetRootPropertyCount(document.RootElement, "requiredNullableList"), Is.EqualTo(1));
            CollectionAssert.AreEqual(
                new[] { 1, 2 },
                document.RootElement.GetProperty("requiredNullableList").EnumerateArray().Select(item => item.GetInt32()).ToArray());
        }

        [Test]
        public void ModelReaderWriterWrite_DoesNotDuplicatePatchedRequiredRootModelCollection()
        {
            var model = SampleTypeSpecModelFactory.DynamicModel(
                name: "dynamic-model",
                foo: new AnotherDynamicModel("bar"));

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            model.Patch.Set("$.listFoo"u8, """[{"bar":"patched"}]"""u8);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            var data = ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default);
            var json = data.ToString();

            using var document = JsonDocument.Parse(json);
            Assert.That(GetRootPropertyCount(document.RootElement, "listFoo"), Is.EqualTo(1));
            var listFoo = document.RootElement.GetProperty("listFoo");
            Assert.That(listFoo.GetArrayLength(), Is.EqualTo(1));
            Assert.That(listFoo[0].GetProperty("bar").GetString(), Is.EqualTo("patched"));
        }

        [Test]
        public void ModelReaderWriterWrite_NestedDotNotationPatchOnPopulatedSubModelMergesWithTypedProperties()
        {
            var model = SampleTypeSpecModelFactory.DynamicModel(
                name: "dynamic-model",
                foo: new AnotherDynamicModel("bar"));

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            model.Patch.Set("$.foo.baz"u8, "\"patched\""u8);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            var data = ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default);
            var json = data.ToString();

            using var document = JsonDocument.Parse(json);
            Assert.That(GetRootPropertyCount(document.RootElement, "foo"), Is.EqualTo(1));
            var foo = document.RootElement.GetProperty("foo");
            Assert.That(foo.GetProperty("bar").GetString(), Is.EqualTo("bar"));
            Assert.That(foo.GetProperty("baz").GetString(), Is.EqualTo("patched"));
        }

        [Test]
        public void ModelReaderWriterWrite_NestedBracketPatchOnPopulatedSubModelMergesWithTypedProperties()
        {
            var model = SampleTypeSpecModelFactory.DynamicModel(
                name: "dynamic-model",
                foo: new AnotherDynamicModel("bar"));

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            model.Patch.Set("$['foo']['baz']"u8, "\"patched\""u8);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            var data = ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default);
            var json = data.ToString();

            using var document = JsonDocument.Parse(json);
            Assert.That(GetRootPropertyCount(document.RootElement, "foo"), Is.EqualTo(1));
            var foo = document.RootElement.GetProperty("foo");
            Assert.That(foo.GetProperty("bar").GetString(), Is.EqualTo("bar"));
            Assert.That(foo.GetProperty("baz").GetString(), Is.EqualTo("patched"));
        }

        [Test]
        public void JsonPatchTryGetValue_CollectionIndexIsBoundsChecked()
        {
            var model = ReadDynamicModel();

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            Assert.That(model.Patch.TryGetValue("$.listFoo[0].bar"u8, out string? value), Is.True);
            Assert.That(value, Is.EqualTo("bar"));
            Assert.That(model.Patch.TryGetValue("$.listFoo[1].bar"u8, out string? _), Is.False);
            Assert.That(model.Patch.TryGetValue("$.listOfListFoo[0][0].bar"u8, out string? _), Is.False);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
        }

        [Test]
        public void JsonPatchSet_CollectionIndexIsBoundsChecked()
        {
            var model = ReadDynamicModel();

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            model.Patch.Set("$.listFoo[1].bar"u8, "\"patched\""u8);
            model.Patch.Set("$.listOfListFoo[0][0].bar"u8, "\"patched\""u8);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
        }

        private static DynamicModel ReadDynamicModel()
        {
            return ModelReaderWriter.Read<DynamicModel>(
                BinaryData.FromString(
                    """
                    {
                      "name": "dynamic-model",
                      "requiredNullableList": [],
                      "requiredNullableDictionary": {},
                      "primitiveDictionary": {},
                      "foo": { "bar": "foo" },
                      "listFoo": [{ "bar": "bar" }],
                      "listOfListFoo": [],
                      "dictionaryFoo": {},
                      "dictionaryOfDictionaryFoo": {},
                      "dictionaryListFoo": {},
                      "listOfDictionaryFoo": []
                    }
                    """),
                ModelReaderWriterOptions.Json,
                SampleTypeSpecContext.Default)!;
        }

        private static int GetRootPropertyCount(JsonElement root, string propertyName) => root.EnumerateObject().Count(property => property.NameEquals(propertyName));
    }
}
