// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text;
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

        [TestCase("modelValue", "J")]
        [TestCase("modelValue", "W")]
        [TestCase("children", "J")]
        [TestCase("children", "W")]
        [TestCase("childDictionary", "J")]
        [TestCase("childDictionary", "W")]
        [TestCase("nestedChildren", "J")]
        [TestCase("nestedChildren", "W")]
        [TestCase("nestedChildDictionary", "J")]
        [TestCase("nestedChildDictionary", "W")]
        [TestCase("dictionaryChildren", "J")]
        [TestCase("dictionaryChildren", "W")]
        [TestCase("listOfDictionaries", "J")]
        [TestCase("listOfDictionaries", "W")]
        public void JsonPatchSetNull_NullDynamicProperty(string propertyName, string format)
        {
            var model = CreateNullableDynamicModel(propertyName);
            var path = Encoding.UTF8.GetBytes($"$.{propertyName}");

#pragma warning disable SCME0001
            Assert.That(model.Patch.TryGetJson(path, out _), Is.False);
            model.Patch.SetNull(path);
            Assert.That(model.Patch.TryGetJson(path, out var json), Is.True);
            Assert.That(Encoding.UTF8.GetString(json.Span), Is.EqualTo("null"));
#pragma warning restore SCME0001

            var data = ModelReaderWriter.Write(model, new ModelReaderWriterOptions(format), SampleTypeSpecContext.Default);
            using var document = JsonDocument.Parse(data);
            Assert.That(GetRootPropertyCount(document.RootElement, propertyName), Is.EqualTo(1));
            Assert.That(document.RootElement.GetProperty(propertyName).ValueKind, Is.EqualTo(JsonValueKind.Null));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void JsonPatchSetNull_UninitializedDynamicChild(bool deserialize)
        {
            var model = deserialize
                ? ModelReaderWriter.Read<NullableDynamicModel>(
                    BinaryData.FromString("{}"), ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default)!
                : new NullableDynamicModel();

            Assert.That(model.ModelValue, Is.Null);
#pragma warning disable SCME0001
            model.Patch.SetNull("$.modelValue"u8);
#pragma warning restore SCME0001
            Assert.That(model.ModelValue, Is.Null);

            var data = ModelReaderWriter.Write(model, new ModelReaderWriterOptions("W"), SampleTypeSpecContext.Default);
            using var document = JsonDocument.Parse(data);
            Assert.That(document.RootElement.GetProperty("modelValue").ValueKind, Is.EqualTo(JsonValueKind.Null));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void JsonPatchGet_DeserializedNullDynamicChild(bool explicitNull)
        {
            var model = ModelReaderWriter.Read<NullableDynamicModel>(
                BinaryData.FromString(explicitNull ? """{"modelValue":null}""" : "{}"),
                ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default)!;

            Assert.That(model.ModelValue, Is.Null);
#pragma warning disable SCME0001
            Assert.That(model.Patch.TryGetJson("$.modelValue"u8, out _), Is.EqualTo(explicitNull));
            Assert.That(model.Patch.TryGetValue("$.modelValue"u8, out string? value), Is.EqualTo(explicitNull));
            Assert.That(value, Is.Null);
            if (explicitNull)
            {
                Assert.That(Encoding.UTF8.GetString(model.Patch.GetJson("$.modelValue"u8)), Is.EqualTo("null"));
            }
#pragma warning restore SCME0001
        }

        [TestCase("modelValue")]
        [TestCase("children")]
        [TestCase("childDictionary")]
        [TestCase("nestedChildren")]
        [TestCase("nestedChildDictionary")]
        [TestCase("dictionaryChildren")]
        [TestCase("listOfDictionaries")]
        public void JsonPatchRemove_NullDynamicProperty(string propertyName)
        {
            var model = CreateNullableDynamicModel(propertyName);
            var path = Encoding.UTF8.GetBytes($"$.{propertyName}");

#pragma warning disable SCME0001
            model.Patch.SetNull(path);
            model.Patch.Remove(path);
            Assert.That(model.Patch.IsRemoved(path), Is.True);
#pragma warning restore SCME0001

            var data = ModelReaderWriter.Write(model, new ModelReaderWriterOptions("W"), SampleTypeSpecContext.Default);
            using var document = JsonDocument.Parse(data);
            Assert.That(document.RootElement.TryGetProperty(propertyName, out _), Is.False);
        }

        [TestCase("$.modelValue.extra", """{"modelValue":{"extra":"patched"}}""")]
        [TestCase("$.children[0].extra", """{"children":[{"extra":"patched"}]}""")]
        [TestCase("$.childDictionary.key.extra", """{"childDictionary":{"key":{"extra":"patched"}}}""")]
        [TestCase("$.nestedChildren[0][0].extra", """{"nestedChildren":[[{"extra":"patched"}]]}""")]
        [TestCase("$.nestedChildDictionary.key.inner.extra", """{"nestedChildDictionary":{"key":{"inner":{"extra":"patched"}}}}""")]
        [TestCase("$.dictionaryChildren.key[0].extra", """{"dictionaryChildren":{"key":[{"extra":"patched"}]}}""")]
        [TestCase("$.listOfDictionaries[0].key.extra", """{"listOfDictionaries":[{"key":{"extra":"patched"}}]}""")]
        public void JsonPatch_NullDynamicPropertyFallsBackToParent(string jsonPath, string expectedJson)
        {
            var model = CreateNullableDynamicModel(jsonPath.Split('.', '[')[1]);
            var path = Encoding.UTF8.GetBytes(jsonPath);

#pragma warning disable SCME0001
            Assert.That(model.Patch.TryGetValue(path, out string? _), Is.False);
            model.Patch.Set(path, "patched");
            Assert.That(model.Patch.TryGetValue(path, out string? value), Is.True);
            Assert.That(value, Is.EqualTo("patched"));
#pragma warning restore SCME0001

            var data = ModelReaderWriter.Write(model, new ModelReaderWriterOptions("W"), SampleTypeSpecContext.Default);
            Assert.That(data.ToString(), Is.EqualTo(expectedJson));
        }

        [TestCase("$.children[0].extra")]
        [TestCase("$.childDictionary.key.extra")]
        [TestCase("$.nestedChildren[0][0].extra")]
        [TestCase("$.nestedChildren[1][0].extra")]
        [TestCase("$.nestedChildDictionary.key.inner.extra")]
        [TestCase("$.nestedChildDictionary.other.inner.extra")]
        [TestCase("$.dictionaryChildren.key[0].extra")]
        [TestCase("$.dictionaryChildren.other[0].extra")]
        [TestCase("$.listOfDictionaries[0].key.extra")]
        [TestCase("$.listOfDictionaries[1].key.extra")]
        public void JsonPatch_NullDynamicCollectionEntryFallsBackToParent(string jsonPath)
        {
            var model = new NullableDynamicModel
            {
                Children = [null],
                ChildDictionary = new Dictionary<string, AnotherDynamicModel> { ["key"] = null! },
                NestedChildren = [null, new List<AnotherDynamicModel> { null! }],
                NestedChildDictionary = new Dictionary<string, IDictionary<string, AnotherDynamicModel>>
                {
                    ["key"] = null!,
                    ["other"] = new Dictionary<string, AnotherDynamicModel> { ["inner"] = null! }
                },
                DictionaryChildren = new Dictionary<string, IList<AnotherDynamicModel>>
                {
                    ["key"] = null!,
                    ["other"] = new List<AnotherDynamicModel> { null! }
                },
                ListOfDictionaries = [null, new Dictionary<string, AnotherDynamicModel> { ["key"] = null! }]
            };
            var path = Encoding.UTF8.GetBytes(jsonPath);

#pragma warning disable SCME0001
            Assert.That(model.Patch.TryGetValue(path, out string? _), Is.False);
            model.Patch.Set(path, "patched");
            Assert.That(model.Patch.TryGetValue(path, out string? value), Is.True);
            Assert.That(value, Is.EqualTo("patched"));
#pragma warning restore SCME0001
        }

        [Test]
        public void JsonPatch_UsesCurrentDynamicChildAfterAssignment()
        {
            var model = new NullableDynamicModel();
            var first = new AnotherDynamicModel("first");
            var second = new AnotherDynamicModel("second");

#pragma warning disable SCME0001
            Assert.That(model.Patch.TryGetValue("$.modelValue.extra"u8, out string? _), Is.False);

            model.ModelValue = first;
            model.Patch.Set("$.modelValue.extra"u8, "one");
            Assert.That(first.Patch.GetString("$.extra"u8), Is.EqualTo("one"));

            model.ModelValue = second;
            Assert.That(model.Patch.TryGetValue("$.modelValue.extra"u8, out string? _), Is.False);
            model.Patch.Set("$.modelValue.extra"u8, "two");
            Assert.That(second.Patch.GetString("$.extra"u8), Is.EqualTo("two"));
            Assert.That(first.Patch.GetString("$.extra"u8), Is.EqualTo("one"));
            Assert.That(model.Patch.GetString("$.modelValue.extra"u8), Is.EqualTo("two"));

            model.ModelValue = null;
            Assert.That(model.Patch.TryGetValue("$.modelValue.extra"u8, out string? _), Is.False);
            model.Patch.SetNull("$.modelValue"u8);
#pragma warning restore SCME0001

            var data = ModelReaderWriter.Write(model, new ModelReaderWriterOptions("W"), SampleTypeSpecContext.Default);
            using var document = JsonDocument.Parse(data);
            Assert.That(document.RootElement.GetProperty("modelValue").ValueKind, Is.EqualTo(JsonValueKind.Null));
        }

        [Test]
        public void JsonPatch_NullableDynamicListElementsArePreserved()
        {
            var model = new NullableDynamicModel
            {
                Children = [null, new AnotherDynamicModel("present")]
            };

#pragma warning disable SCME0001
            Assert.That(model.Patch.TryGetJson("$.children"u8, out var json), Is.True);
            using var patchDocument = JsonDocument.Parse(json);
            Assert.That(patchDocument.RootElement[0].ValueKind, Is.EqualTo(JsonValueKind.Null));
            Assert.That(patchDocument.RootElement[1].GetProperty("bar").GetString(), Is.EqualTo("present"));
#pragma warning restore SCME0001

            var data = ModelReaderWriter.Write(model, new ModelReaderWriterOptions("W"), SampleTypeSpecContext.Default);
            using var document = JsonDocument.Parse(data);
            var children = document.RootElement.GetProperty("children");
            Assert.That(children.GetArrayLength(), Is.EqualTo(2));
            Assert.That(children[0].ValueKind, Is.EqualTo(JsonValueKind.Null));
            Assert.That(children[1].GetProperty("bar").GetString(), Is.EqualTo("present"));
        }

        [TestCase("children", false, "J")]
        [TestCase("children", false, "W")]
        [TestCase("children", true, "J")]
        [TestCase("children", true, "W")]
        [TestCase("nestedChildren", false, "J")]
        [TestCase("nestedChildren", false, "W")]
        [TestCase("nestedChildren", true, "J")]
        [TestCase("nestedChildren", true, "W")]
        public void JsonPatchRemove_NullDynamicListElementSerialization(string propertyName, bool onlyNull, string format)
        {
            var model = CreateModelWithRemovedDynamicListElements(propertyName, onlyNull);

            var data = ModelReaderWriter.Write(model, new ModelReaderWriterOptions(format), SampleTypeSpecContext.Default);
            using var document = JsonDocument.Parse(data);
            var items = propertyName switch
            {
                "children" => document.RootElement.GetProperty(propertyName),
                "nestedChildren" => document.RootElement.GetProperty(propertyName)[0],
                _ => throw new ArgumentOutOfRangeException(nameof(propertyName))
            };
            Assert.That(items.GetRawText(), Is.EqualTo(onlyNull ? "[]" : """[{"bar":"present"},null]"""));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void JsonPatchRemove_NullDynamicListElementSnapshot(bool onlyNull)
        {
            var model = CreateModelWithRemovedDynamicListElements("children", onlyNull);

#pragma warning disable SCME0001
            var json = model.Patch.GetJson("$.children"u8);
#pragma warning restore SCME0001

            Assert.That(Encoding.UTF8.GetString(json), Is.EqualTo(onlyNull ? "[]" : """[{"bar":"present"},null]"""));
        }

        private static NullableDynamicModel CreateModelWithRemovedDynamicListElements(string propertyName, bool onlyNull)
        {
            var items = onlyNull ? "[null]" : """[null,{"bar":"present"},null]""";
            var (json, path) = propertyName switch
            {
                "children" => ($$"""{"children":{{items}}}""", "$.children"),
                "nestedChildren" => ($$"""{"nestedChildren":[{{items}}]}""", "$.nestedChildren[0]"),
                _ => throw new ArgumentOutOfRangeException(nameof(propertyName), propertyName, null)
            };
            var model = ModelReaderWriter.Read<NullableDynamicModel>(
                BinaryData.FromString(json), ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default)!;

#pragma warning disable SCME0001
            model.Patch.Remove(Encoding.UTF8.GetBytes(path + "[0]"));
#pragma warning restore SCME0001

            return model;
        }

        private static NullableDynamicModel CreateNullableDynamicModel(string propertyName)
        {
            var model = new NullableDynamicModel();
            switch (propertyName)
            {
                case "modelValue":
                    model.ModelValue = null;
                    break;
                case "children":
                    model.Children = null;
                    break;
                case "childDictionary":
                    model.ChildDictionary = null;
                    break;
                case "nestedChildren":
                    model.NestedChildren = null;
                    break;
                case "nestedChildDictionary":
                    model.NestedChildDictionary = null;
                    break;
                case "dictionaryChildren":
                    model.DictionaryChildren = null;
                    break;
                case "listOfDictionaries":
                    model.ListOfDictionaries = null;
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(propertyName), propertyName, null);
            }
            return model;
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
