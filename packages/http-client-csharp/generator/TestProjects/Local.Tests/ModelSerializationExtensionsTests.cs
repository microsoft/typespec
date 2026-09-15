// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Buffers;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class ModelSerializationExtensionsTests
    {
        [TestCase("{ \"text\": \"こんにちは 🌍\", \"escaped\": \"\\u0061\" }")]
        [TestCase("[1, true, null, {\"nested\": []}]")]
        [TestCase("\"hello\"")]
        [TestCase("1.2300e+10")]
        [TestCase("null")]
        public void GetUtf8BytesPreservesRawJsonAfterDocumentIsDisposed(string json)
        {
            BinaryData data;
            using (var document = JsonDocument.Parse($"{{\"value\":{json}}}"))
            {
                data = document.RootElement.GetProperty("value").GetUtf8Bytes();
            }

            CollectionAssert.AreEqual(Encoding.UTF8.GetBytes(json), data.ToArray());
        }

        [Test]
        public void GetUtf8BytesRejectsUndefinedElement()
        {
            Assert.Throws<InvalidOperationException>(() => default(JsonElement).GetUtf8Bytes());
        }

        [Test]
        public void GetUtf8BytesRejectsDisposedDocument()
        {
            var document = JsonDocument.Parse("{}");
            var element = document.RootElement;
            document.Dispose();

            Assert.Throws<ObjectDisposedException>(() => element.GetUtf8Bytes());
        }

        [TestCase(0, "D")]
        [TestCase(1, "D")]
        [TestCase(2, "D")]
        [TestCase(3, "D")]
        [TestCase(4096, "D")]
        [TestCase(0, "U")]
        [TestCase(1, "U")]
        [TestCase(2, "U")]
        [TestCase(3, "U")]
        [TestCase(4096, "U")]
        public void WriteBase64StringValueMatchesExistingFormat(int payloadSize, string format)
        {
            byte[] payload = Enumerable.Range(0, payloadSize).Select(i => (byte)(i * 37)).ToArray();

            AssertBase64Value(payload, format);
        }

        // payloads below encode to base64 values containing the url unsafe characters '+' and '/'
        // as well as the various padding combinations
        [TestCase(new byte[] { 0xFB, 0xFF }, "U", "+/8=")]
        [TestCase(new byte[] { 0xFB, 0xFF, 0xBF }, "U", "+/+/")]
        [TestCase(new byte[] { 0xFF }, "U", "/w==")]
        [TestCase(new byte[] { 0x03, 0xEF, 0xFF }, "U", "A+//")]
        [TestCase(new byte[] { 0xFB, 0xFF }, "D", "+/8=")]
        [TestCase(new byte[] { 0xFB, 0xFF, 0xBF }, "D", "+/+/")]
        [TestCase(new byte[] { 0xFF }, "D", "/w==")]
        [TestCase(new byte[] { 0x03, 0xEF, 0xFF }, "D", "A+//")]
        public void WriteBase64StringValueHandlesUrlUnsafeCharacters(byte[] payload, string format, string base64)
        {
            Assert.AreEqual(base64, Convert.ToBase64String(payload));

            AssertBase64Value(payload, format);
        }

        private static readonly Dictionary<string, (string Json, Action<OptionalNullableProperties, bool> SetValue, Func<OptionalNullableProperties, object?> GetValue)> OptionalNullableScalarCases = new()
        {
            ["inheritedNullable"] = ("\"inherited\"", (model, isNull) => model.InheritedNullable = isNull ? null : "inherited", model => model.InheritedNullable),
            ["nullableModel"] = ("""{"value":"child"}""", (model, isNull) => model.NullableModel = isNull ? null : new OptionalNullableChild("child"), model => model.NullableModel),
            ["nullableString"] = ("\"text\"", (model, isNull) => model.NullableString = isNull ? null : "text", model => model.NullableString),
            ["nullableInt"] = ("42", (model, isNull) => model.NullableInt = isNull ? null : 42, model => model.NullableInt),
            ["nullableBoolean"] = ("false", (model, isNull) => model.NullableBoolean = isNull ? null : false, model => model.NullableBoolean),
            ["nullableEnum"] = ("\"2\"", (model, isNull) => model.NullableEnum = isNull ? null : StringFixedEnum.Two, model => model.NullableEnum),
            ["nullableDateTime"] = ("\"2026-01-02T03:04:05.0000000Z\"", (model, isNull) => model.NullableOn = isNull ? null : new DateTimeOffset(2026, 1, 2, 3, 4, 5, TimeSpan.Zero), model => model.NullableOn),
            ["nullableBytes"] = ("\"AAH/\"", (model, isNull) => model.NullableBytes = isNull ? null : BinaryData.FromBytes(new byte[] { 0, 1, 255 }), model => model.NullableBytes),
        };

        private static IEnumerable<string> OptionalNullableScalarNames => OptionalNullableScalarCases.Keys;

        [Test]
        public void OptionalNullableProperties_PublicPropertyTypesAreUnchanged()
        {
            var propertyTypes = new Dictionary<string, Type>
            {
                [nameof(OptionalNullableProperties.InheritedNullable)] = typeof(string),
                [nameof(OptionalNullableProperties.NullableModel)] = typeof(OptionalNullableChild),
                [nameof(OptionalNullableProperties.NullableString)] = typeof(string),
                [nameof(OptionalNullableProperties.NullableInt)] = typeof(int?),
                [nameof(OptionalNullableProperties.NullableBoolean)] = typeof(bool?),
                [nameof(OptionalNullableProperties.NullableEnum)] = typeof(StringFixedEnum?),
                [nameof(OptionalNullableProperties.NullableOn)] = typeof(DateTimeOffset?),
                [nameof(OptionalNullableProperties.NullableBytes)] = typeof(BinaryData),
                [nameof(OptionalNullableProperties.NullableList)] = typeof(IList<string>),
                [nameof(OptionalNullableProperties.NullableDictionary)] = typeof(IDictionary<string, int?>),
                [nameof(OptionalNullableProperties.ReadOnlyNullable)] = typeof(string),
                [nameof(OptionalNullableProperties.RequiredNullable)] = typeof(string),
                [nameof(OptionalNullableProperties.OptionalNonNullable)] = typeof(string),
                [nameof(OptionalNullableProperties.OptionalNonNullableInt)] = typeof(int?)
            };

            foreach (var property in propertyTypes)
            {
                Assert.That(typeof(OptionalNullableProperties).GetProperty(property.Key)!.PropertyType, Is.EqualTo(property.Value), property.Key);
            }
        }

        [Test]
        public void OptionalNullableProperties_UntouchedPropertiesAreOmitted([Values("W", "J")] string format)
        {
            var model = new OptionalNullableProperties(requiredNullable: null);

            foreach (var scalarCase in OptionalNullableScalarCases.Values)
            {
                Assert.That(scalarCase.GetValue(model), Is.Null);
            }
            Assert.That(model.NullableList, Is.Empty);
            Assert.That(model.NullableDictionary, Is.Empty);
            AssertModelJson(model, """{"requiredNullable":null}""", format);
        }

        [Test]
        public void OptionalNullableProperties_ExplicitNullSetterWritesNull(
            [ValueSource(nameof(OptionalNullableScalarNames))] string propertyName,
            [Values("W", "J")] string format,
            [Values(false, true)] bool deserialize)
        {
            var model = deserialize
                ? ReadOptionalNullableProperties("""{"requiredNullable":null}""", format)
                : new OptionalNullableProperties(requiredNullable: null);
            var scalarCase = OptionalNullableScalarCases[propertyName];

            scalarCase.SetValue(model, true);
            Assert.That(scalarCase.GetValue(model), Is.Null);
            AssertModelJson(model, OptionalNullableJson(propertyName, "null"), format);

            scalarCase.SetValue(model, true);
            AssertModelJson(model, OptionalNullableJson(propertyName, "null"), format);
        }

        [Test]
        public void OptionalNullableProperties_ValueNullValueTransitions(
            [ValueSource(nameof(OptionalNullableScalarNames))] string propertyName,
            [Values("W", "J")] string format,
            [Values(false, true)] bool deserialize)
        {
            var model = deserialize
                ? ReadOptionalNullableProperties(OptionalNullableJson(propertyName, "null"), format)
                : new OptionalNullableProperties(requiredNullable: null);
            var scalarCase = OptionalNullableScalarCases[propertyName];

            scalarCase.SetValue(model, false);
            Assert.That(scalarCase.GetValue(model), Is.Not.Null);
            AssertModelJson(model, OptionalNullableJson(propertyName, scalarCase.Json), format);

            scalarCase.SetValue(model, true);
            Assert.That(scalarCase.GetValue(model), Is.Null);
            AssertModelJson(model, OptionalNullableJson(propertyName, "null"), format);

            scalarCase.SetValue(model, false);
            Assert.That(scalarCase.GetValue(model), Is.Not.Null);
            AssertModelJson(model, OptionalNullableJson(propertyName, scalarCase.Json), format);
        }

        [Test]
        public void OptionalNullableProperties_DeserializePreservesPresence(
            [ValueSource(nameof(OptionalNullableScalarNames))] string propertyName,
            [Values("absent", "null", "value")] string state,
            [Values("W", "J")] string readFormat,
            [Values("W", "J")] string writeFormat,
            [Values(false, true)] bool useJsonModel)
        {
            var scalarCase = OptionalNullableScalarCases[propertyName];
            string json = state == "absent"
                ? """{"requiredNullable":null}"""
                : OptionalNullableJson(propertyName, state == "null" ? "null" : scalarCase.Json);
            var model = ReadOptionalNullableProperties(json, readFormat, useJsonModel);

            Assert.That(scalarCase.GetValue(model), state == "value" ? Is.Not.Null : Is.Null);
            AssertModelJson(model, json, writeFormat);
        }

        [Test]
        public void OptionalNullableProperties_DuplicatePropertyLastValueWins(
            [ValueSource(nameof(OptionalNullableScalarNames))] string propertyName,
            [Values(false, true)] bool nullLast,
            [Values("W", "J")] string format)
        {
            var scalarCase = OptionalNullableScalarCases[propertyName];
            string first = nullLast ? scalarCase.Json : "null";
            string last = nullLast ? "null" : scalarCase.Json;
            string json = $"{{\"requiredNullable\":null,\"{propertyName}\":{first},\"{propertyName}\":{last}}}";
            var model = ReadOptionalNullableProperties(json, format);

            Assert.That(scalarCase.GetValue(model), nullLast ? Is.Null : Is.Not.Null);
            AssertModelJson(model, OptionalNullableJson(propertyName, last), format);
        }

        [Test]
        public void OptionalNullableProperties_RequiredAndNonNullableControls([Values("W", "J")] string format)
        {
            var model = new OptionalNullableProperties(requiredNullable: null)
            {
                OptionalNonNullable = null,
                OptionalNonNullableInt = null,
                NullableInt = 0,
                NullableBoolean = false,
                NullableString = string.Empty
            };
            AssertModelJson(model, """{"requiredNullable":null,"nullableInt":0,"nullableBoolean":false,"nullableString":""}""", format);

            model.RequiredNullable = "required";
            model.OptionalNonNullable = "optional";
            model.OptionalNonNullableInt = 0;
            AssertModelJson(model, """{"requiredNullable":"required","optionalNonNullable":"optional","optionalNonNullableInt":0,"nullableInt":0,"nullableBoolean":false,"nullableString":""}""", format);

            model.RequiredNullable = null;
            model.OptionalNonNullable = null;
            model.OptionalNonNullableInt = null;
            AssertModelJson(model, """{"requiredNullable":null,"nullableInt":0,"nullableBoolean":false,"nullableString":""}""", format);
        }

        [Test]
        public void OptionalNullableProperties_FactoryDefaultsRemainOmitted([Values("W", "J")] string format)
        {
            var model = SampleTypeSpecModelFactory.OptionalNullableProperties();
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":[]}""", format);

            // Factories retain their existing collection materialization and scalar default semantics.
            model = SampleTypeSpecModelFactory.OptionalNullableProperties(
                inheritedNullable: null,
                nullableModel: null,
                nullableString: null,
                nullableInt: null,
                nullableBoolean: null,
                nullableEnum: null,
                nullableOn: null,
                nullableBytes: null,
                nullableList: null,
                nullableDictionary: null,
                readOnlyNullable: null);
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":[]}""", format);

            model.NullableString = null;
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":[],"nullableString":null}""", format);
        }

        [Test]
        public void OptionalNullableProperties_FactoryValuesCanBeCleared([Values("W", "J")] string format)
        {
            var model = SampleTypeSpecModelFactory.OptionalNullableProperties(
                inheritedNullable: "inherited",
                nullableModel: new OptionalNullableChild("child"),
                nullableString: "text",
                nullableInt: 42,
                nullableBoolean: false,
                nullableEnum: StringFixedEnum.Two,
                nullableOn: new DateTimeOffset(2026, 1, 2, 3, 4, 5, TimeSpan.Zero),
                nullableBytes: BinaryData.FromBytes(new byte[] { 0, 1, 255 }));
            string values = string.Join(",", OptionalNullableScalarCases.Select(item => $"\"{item.Key}\":{item.Value.Json}"));
            AssertModelJson(model, $"{{\"requiredNullable\":null,\"nullableList\":[],{values}}}", format);

            foreach (var scalarCase in OptionalNullableScalarCases.Values)
            {
                scalarCase.SetValue(model, true);
            }
            string nulls = string.Join(",", OptionalNullableScalarNames.Select(name => $"\"{name}\":null"));
            AssertModelJson(model, $"{{\"requiredNullable\":null,\"nullableList\":[],{nulls}}}", format);
        }

        [Test]
        public void OptionalNullableCollections_ReadingEmptyCollectionsDoesNotDefineThem(
            [Values("W", "J")] string format,
            [Values(false, true)] bool deserialize)
        {
            var model = deserialize
                ? ReadOptionalNullableProperties("""{"requiredNullable":null}""", format)
                : new OptionalNullableProperties(requiredNullable: null);

            Assert.That(model.NullableList.Count, Is.Zero);
            Assert.That(model.NullableList.Any(), Is.False);
            Assert.That(model.NullableDictionary.Count, Is.Zero);
            Assert.That(model.NullableDictionary.Keys, Is.Empty);
            Assert.That(model.NullableDictionary.Values, Is.Empty);
            AssertModelJson(model, """{"requiredNullable":null}""", format);
        }

        [Test]
        public void OptionalNullableCollections_AddAndClearDefineCollections(
            [Values("W", "J")] string format,
            [Values(false, true)] bool clearWithoutAdding)
        {
            var model = new OptionalNullableProperties(requiredNullable: null);

            if (!clearWithoutAdding)
            {
                model.NullableList.Add(null);
                model.NullableList.Add("item");
                model.NullableDictionary.Add("null", null);
                model.NullableDictionary.Add("value", 42);
                AssertModelJson(model, """{"requiredNullable":null,"nullableList":[null,"item"],"nullableDictionary":{"null":null,"value":42}}""", format);
            }

            model.NullableList.Clear();
            model.NullableDictionary.Clear();
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":[],"nullableDictionary":{}}""", format);
        }

        [Test]
        public void OptionalNullableCollections_ExplicitNullAndReplacementPreservePresence(
            [Values("W", "J")] string format,
            [Values(false, true)] bool deserialize)
        {
            var model = deserialize
                ? ReadOptionalNullableProperties("""{"requiredNullable":null}""", format)
                : new OptionalNullableProperties(requiredNullable: null);
            model.NullableList = null;
            model.NullableDictionary = null;
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":null,"nullableDictionary":null}""", format);

            model.NullableList = new List<string> { null!, "item" };
            model.NullableDictionary = new Dictionary<string, int?> { ["null"] = null, ["value"] = 42 };
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":[null,"item"],"nullableDictionary":{"null":null,"value":42}}""", format);

            model.NullableList = null;
            model.NullableDictionary = null;
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":null,"nullableDictionary":null}""", format);

            model.NullableList = new List<string>();
            model.NullableDictionary = new Dictionary<string, int?>();
            AssertModelJson(model, """{"requiredNullable":null,"nullableList":[],"nullableDictionary":{}}""", format);
        }

        [Test]
        public void OptionalNullableCollections_DeserializePreservesPresence(
            [Values("absent", "null", "empty", "populated")] string state,
            [Values("W", "J")] string readFormat,
            [Values("W", "J")] string writeFormat,
            [Values(false, true)] bool useJsonModel)
        {
            string json = state switch
            {
                "absent" => """{"requiredNullable":null}""",
                "null" => """{"requiredNullable":null,"nullableList":null,"nullableDictionary":null}""",
                "empty" => """{"requiredNullable":null,"nullableList":[],"nullableDictionary":{}}""",
                _ => """{"requiredNullable":null,"nullableList":[null,"item"],"nullableDictionary":{"null":null,"value":42}}"""
            };
            var model = ReadOptionalNullableProperties(json, readFormat, useJsonModel);

            if (state == "populated")
            {
                Assert.That(model.NullableList, Is.EqualTo(new string?[] { null, "item" }));
                Assert.That(model.NullableDictionary["null"], Is.Null);
                Assert.That(model.NullableDictionary["value"], Is.EqualTo(42));
            }
            AssertModelJson(model, json, writeFormat);
        }

        [Test]
        public void OptionalNullableCollections_DuplicatePropertyLastValueWins(
            [Values(false, true)] bool nullLast,
            [Values("W", "J")] string format)
        {
            string firstList = nullLast ? "[null,\"item\"]" : "null";
            string lastList = nullLast ? "null" : "[null,\"item\"]";
            string firstDictionary = nullLast ? "{\"key\":null}" : "null";
            string lastDictionary = nullLast ? "null" : "{\"key\":null}";
            string json = $"{{\"requiredNullable\":null,\"nullableList\":{firstList},\"nullableList\":{lastList},\"nullableDictionary\":{firstDictionary},\"nullableDictionary\":{lastDictionary}}}";
            var model = ReadOptionalNullableProperties(json, format);

            AssertModelJson(model, $"{{\"requiredNullable\":null,\"nullableList\":{lastList},\"nullableDictionary\":{lastDictionary}}}", format);
        }

        [Test]
        public void OptionalNullableProperties_ReadOnlyNullPersistsOnlyInJson(
            [Values("absent", "null", "value")] string state,
            [Values("W", "J")] string format)
        {
            string json = state == "absent"
                ? """{"requiredNullable":null}"""
                : OptionalNullableJson("readOnlyNullable", state == "null" ? "null" : "\"output\"");
            var model = ReadOptionalNullableProperties(json, "J");

            Assert.That(model.ReadOnlyNullable, Is.EqualTo(state == "value" ? "output" : null));
            AssertModelJson(model, format == "J" ? json : """{"requiredNullable":null}""", format);
        }

        [Test]
        public void OptionalNullableProperties_NestedWireSerializationPreservesPresence()
        {
            var child = new OptionalNullableProperties(requiredNullable: null);
            var model = new OptionalNullableContainer(child);
            AssertModelJson(model, """{"child":{"requiredNullable":null}}""", "W");

            child.InheritedNullable = null;
            child.NullableModel = null;
            child.NullableString = null;
            child.NullableList = null;
            child.NullableDictionary = null;
            AssertModelJson(model, """{"child":{"requiredNullable":null,"inheritedNullable":null,"nullableModel":null,"nullableString":null,"nullableList":null,"nullableDictionary":null}}""", "W");

            child = ReadOptionalNullableProperties("""{"requiredNullable":null,"inheritedNullable":null,"nullableModel":null,"readOnlyNullable":null}""", "J");
            model = new OptionalNullableContainer(child);
            AssertModelJson(model, """{"child":{"requiredNullable":null,"inheritedNullable":null,"nullableModel":null}}""", "W");
        }

        [Test]
        public void NullableDynamicModel_PropertySetterNullPreservesPresence([Values("W", "J")] string format)
        {
            var model = new NullableDynamicModel();
            AssertModelJson(model, "{}", format);

            model.ModelValue = null;
            AssertModelJson(model, """{"modelValue":null}""", format);

            model.ModelValue = new AnotherDynamicModel("value");
            AssertModelJson(model, """{"modelValue":{"bar":"value"}}""", format);

            model.ModelValue = null;
            AssertModelJson(model, """{"modelValue":null}""", format);
        }

        [Test]
        public void OptionalNullableDynamicProperties_PreserveInheritedPresence([Values("W", "J")] string format)
        {
            var model = new OptionalNullableDynamicProperties();
            AssertModelJson(model, "{}", format);
            model.InheritedNullable = null;
            AssertModelJson(model, """{"inheritedNullable":null}""", format);
            model.InheritedNullable = "typed";
            AssertModelJson(model, """{"inheritedNullable":"typed"}""", format);

            model = ModelReaderWriter.Read<OptionalNullableDynamicProperties>(
                BinaryData.FromString("""{"inheritedNullable":null}"""),
                new ModelReaderWriterOptions(format), SampleTypeSpecContext.Default)!;
            AssertModelJson(model, """{"inheritedNullable":null}""", format);

#pragma warning disable SCME0001
            model.Patch.Set("$.inheritedNullable"u8, "patched");
            AssertModelJson(model, """{"inheritedNullable":"patched"}""", format);
            model.Patch.Remove("$.inheritedNullable"u8);
            AssertModelJson(model, "{}", format);
#pragma warning restore SCME0001
        }

        [Test]
        public void NullableDynamicModel_PatchOverridesExplicitPropertyNull([Values("W", "J")] string format)
        {
            var model = new NullableDynamicModel { ModelValue = null };

#pragma warning disable SCME0001
            model.Patch.Set("$.modelValue"u8, """{"bar":"patched"}"""u8);
            AssertModelJson(model, """{"modelValue":{"bar":"patched"}}""", format);

            model.Patch.SetNull("$.modelValue"u8);
            AssertModelJson(model, """{"modelValue":null}""", format);

            model.ModelValue = new AnotherDynamicModel("typed");
            AssertModelJson(model, """{"modelValue":null}""", format);

            model.ModelValue = null;
            model.Patch.Remove("$.modelValue"u8);
            AssertModelJson(model, "{}", format);
#pragma warning restore SCME0001
        }

        private static string OptionalNullableJson(string propertyName, string value) =>
            $"{{\"requiredNullable\":null,\"{propertyName}\":{value}}}";

        private static OptionalNullableProperties ReadOptionalNullableProperties(string json, string format, bool useJsonModel = false)
        {
            var options = new ModelReaderWriterOptions(format);
            var data = BinaryData.FromString(json);
            if (useJsonModel)
            {
                var reader = new Utf8JsonReader(data.ToMemory().Span);
                return ((IJsonModel<OptionalNullableProperties>)new OptionalNullableProperties(requiredNullable: null)).Create(ref reader, options)!;
            }
            return ModelReaderWriter.Read<OptionalNullableProperties>(data, options, SampleTypeSpecContext.Default)!;
        }

        private static void AssertModelJson<T>(T model, string expectedJson, string format) where T : IJsonModel<T>
        {
            var options = new ModelReaderWriterOptions(format);
            using var expected = JsonDocument.Parse(expectedJson);
            using var actual = JsonDocument.Parse(ModelReaderWriter.Write(model, options, SampleTypeSpecContext.Default));
            AssertJsonShape(expected.RootElement, actual.RootElement);

            var buffer = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(buffer))
            {
                model.Write(writer, options);
            }
            using var direct = JsonDocument.Parse(buffer.WrittenMemory);
            AssertJsonShape(expected.RootElement, direct.RootElement);
        }

        private static void AssertJsonShape(JsonElement expected, JsonElement actual)
        {
            Assert.That(actual.ValueKind, Is.EqualTo(expected.ValueKind));
            switch (expected.ValueKind)
            {
                case JsonValueKind.Object:
                    Assert.That(
                        actual.EnumerateObject().Select(property => property.Name),
                        Is.EquivalentTo(expected.EnumerateObject().Select(property => property.Name)));
                    foreach (var property in expected.EnumerateObject())
                    {
                        AssertJsonShape(property.Value, actual.GetProperty(property.Name));
                    }
                    break;
                case JsonValueKind.Array:
                    Assert.That(actual.GetArrayLength(), Is.EqualTo(expected.GetArrayLength()));
                    for (int i = 0; i < expected.GetArrayLength(); i++)
                    {
                        AssertJsonShape(expected[i], actual[i]);
                    }
                    break;
                case JsonValueKind.String:
                    Assert.That(actual.GetString(), Is.EqualTo(expected.GetString()));
                    break;
                case JsonValueKind.Number:
                    Assert.That(actual.GetDecimal(), Is.EqualTo(expected.GetDecimal()));
                    break;
            }
        }

        private static void AssertBase64Value(byte[] payload, string format)
        {
            string expected = Convert.ToBase64String(payload);
            if (format == "U")
            {
                expected = expected.Replace('+', '-').Replace('/', '_').TrimEnd('=');
            }
            expected = $"\"{expected}\"";

            var binaryDataOutput = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(binaryDataOutput))
            {
                writer.WriteBase64StringValue(BinaryData.FromBytes(payload), format);
            }
            Assert.AreEqual(expected, Encoding.UTF8.GetString(binaryDataOutput.WrittenSpan));

            var byteArrayOutput = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(byteArrayOutput))
            {
                writer.WriteBase64StringValue(payload, format);
            }
            Assert.AreEqual(expected, Encoding.UTF8.GetString(byteArrayOutput.WrittenSpan));
        }
    }
}
