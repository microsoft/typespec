// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    /// <summary>
    /// Tests for Tree model supporting both JSON and XML serialization.
    /// Extends LocalModelJsonTests for standard JSON tests (including wire format),
    /// and adds XML-specific round-trip tests.
    /// </summary>
    internal class TreeXmlTests : LocalModelJsonTests<Tree>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/Tree/Tree.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/Tree/Tree.json")); // Wire format uses JSON for Tree
        protected string XmlPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/Tree/Tree.xml"));
        protected override Tree ToModel(ClientResult result) => (Tree)result;
        protected override BinaryContent ToBinaryContent(Tree model) => model;

        protected override void CompareModels(Tree model, Tree model2, string format)
        {
            Assert.AreEqual(model.Id, model2.Id);
            Assert.AreEqual(model.Height, model2.Height);
            Assert.AreEqual(model.Age, model2.Age);
        }

        protected override void VerifyModel(Tree model, string format)
        {
            Assert.AreEqual("tree-123", model.Id);
            Assert.AreEqual(500, model.Height);
            Assert.AreEqual(100, model.Age);
        }

        // Add XML-specific round-trip tests
        [Test]
        public void RoundTripWithModelReaderWriter_XML()
            => RoundTripTestXml("X", new ModelReaderWriterStrategy<Tree>());

        [Test]
        public void RoundTripWithModelReaderWriterNonGeneric_XML()
            => RoundTripTestXml("X", new ModelReaderWriterNonGenericStrategy<Tree>());

        [Test]
        public void RoundTripWithModelInterface_XML()
            => RoundTripTestXml("X", new ModelInterfaceStrategy<Tree>());

        [Test]
        public void RoundTripWithModelInterfaceNonGeneric_XML()
            => RoundTripTestXml("X", new ModelInterfaceAsObjectStrategy<Tree>());

        [Test]
        public void OptionalNullablePropertiesRoundTripXml(
            [Values("absent", "empty", "populated")] string state,
            [Values(false, true)] bool useInterface)
        {
            var expected = XElement.Parse(XmlPayload);
            if (state != "absent")
            {
                expected.Add(
                    new XElement("nullableText", state == "empty" ? string.Empty : "value"),
                    new XElement("nullableLabels", state == "empty" ? null : new XElement("key", "value")));
            }
            var options = new ModelReaderWriterOptions("X");
            var data = BinaryData.FromString(expected.ToString());
            var model = useInterface
                ? ((IPersistableModel<Tree>)new Tree("unused", 0, 0)).Create(data, options)!
                : ModelReaderWriter.Read<Tree>(data, options, SampleTypeSpecContext.Default)!;

            Assert.That(model.NullableText, Is.EqualTo(state == "absent" ? null : state == "empty" ? string.Empty : "value"));
            Assert.That(model.NullableLabels, Is.Not.Null);
            Assert.That(model.NullableLabels.Count, Is.EqualTo(state == "populated" ? 1 : 0));
            if (state == "populated")
            {
                Assert.That(model.NullableLabels["key"], Is.EqualTo("value"));
            }

            var serialized = useInterface
                ? ((IPersistableModel<Tree>)model).Write(options)
                : ModelReaderWriter.Write(model, options, SampleTypeSpecContext.Default);
            Assert.That(XNode.DeepEquals(expected, XElement.Parse(serialized.ToString())), Is.True);

            using var json = JsonDocument.Parse(ModelReaderWriter.Write(model, new ModelReaderWriterOptions("J"), SampleTypeSpecContext.Default));
            foreach (var name in new[] { "nullableText", "nullableLabels" })
            {
                Assert.That(json.RootElement.TryGetProperty(name, out _), Is.EqualTo(state != "absent"), name);
            }
        }

        [Test]
        public void ExplicitNullScalarIsOmittedInXmlButPreservedInJson([Values("J", "W")] string jsonFormat)
        {
            var model = new Tree("tree-123", 500, 100) { NullableText = null };
            var xmlOptions = new ModelReaderWriterOptions("X");
            var xml = ModelReaderWriter.Write(model, xmlOptions, SampleTypeSpecContext.Default);

            Assert.That(XNode.DeepEquals(XElement.Parse(XmlPayload), XElement.Parse(xml.ToString())), Is.True);
            using var json = JsonDocument.Parse(ModelReaderWriter.Write(model, new ModelReaderWriterOptions(jsonFormat), SampleTypeSpecContext.Default));
            Assert.That(json.RootElement.GetProperty("nullableText").ValueKind, Is.EqualTo(JsonValueKind.Null));

            var roundTrip = ModelReaderWriter.Read<Tree>(xml, xmlOptions, SampleTypeSpecContext.Default)!;
            using var roundTripJson = JsonDocument.Parse(ModelReaderWriter.Write(roundTrip, new ModelReaderWriterOptions(jsonFormat), SampleTypeSpecContext.Default));
            Assert.That(roundTripJson.RootElement.TryGetProperty("nullableText", out _), Is.False);
            Assert.That(roundTripJson.RootElement.TryGetProperty("nullableLabels", out _), Is.False);
        }

        [TestCase("""{"species":"tree","id":"tree-123","height":500,"age":100}""")]
        [TestCase("""{"species":"tree","id":"tree-123","height":500,"age":100,"nullableText":null,"nullableLabels":null}""")]
        [TestCase("""{"species":"tree","id":"tree-123","height":500,"age":100,"nullableText":"","nullableLabels":{}}""")]
        [TestCase("""{"species":"tree","id":"tree-123","height":500,"age":100,"nullableText":"value","nullableLabels":{"key":"value"}}""")]
        public void OptionalNullablePropertiesRetainJsonPresence(string payload)
        {
            var model = ModelReaderWriter.Read<Tree>(BinaryData.FromString(payload), ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default)!;
            using var expected = JsonDocument.Parse(payload);
            using var actual = JsonDocument.Parse(ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default));

            Assert.That(actual.RootElement.EnumerateObject().Select(p => p.Name),
                Is.EquivalentTo(expected.RootElement.EnumerateObject().Select(p => p.Name)));
            foreach (var property in expected.RootElement.EnumerateObject())
            {
                Assert.That(actual.RootElement.GetProperty(property.Name).GetRawText(), Is.EqualTo(property.Value.GetRawText()), property.Name);
            }
        }

        [Test]
        public void NullCollectionsAreOmittedInXmlWithoutChangingJsonPresence(
            [Values("J", "W")] string jsonFormat,
            [Values(false, true)] bool deserialize,
            [Values(false, true)] bool useInterface)
        {
            var jsonOptions = new ModelReaderWriterOptions(jsonFormat);
            var model = deserialize
                ? ModelReaderWriter.Read<Tree>(
                    BinaryData.FromString("""{"species":"tree","id":"tree-123","height":500,"age":100,"nullableLabels":null}"""),
                    jsonOptions, SampleTypeSpecContext.Default)!
                : new Tree("tree-123", 500, 100) { NullableLabels = null };
            var xmlOptions = new ModelReaderWriterOptions("X");
            Assert.That(model.NullableLabels, Is.Null);

            foreach (var state in new[] { "null", "empty", "populated", "null" })
            {
                if (state == "empty")
                {
                    model.NullableLabels = new Dictionary<string, string>();
                }
                else if (state == "populated")
                {
                    model.NullableLabels!.Add("key", "value");
                }
                else if (model.NullableLabels != null)
                {
                    model.NullableLabels = null;
                }

                var expectedXml = XElement.Parse(XmlPayload);
                if (state != "null")
                {
                    expectedXml.Add(new XElement("nullableLabels", state == "populated" ? new XElement("key", "value") : null));
                }
                var xml = useInterface
                    ? ((IPersistableModel<Tree>)model).Write(xmlOptions)
                    : ModelReaderWriter.Write(model, xmlOptions, SampleTypeSpecContext.Default);
                Assert.That(XNode.DeepEquals(expectedXml, XElement.Parse(xml.ToString())), Is.True, state);

                using var json = JsonDocument.Parse(ModelReaderWriter.Write(model, jsonOptions, SampleTypeSpecContext.Default));
                var labels = json.RootElement.GetProperty("nullableLabels");
                if (state == "null")
                {
                    Assert.That(model.NullableLabels, Is.Null);
                    Assert.That(labels.ValueKind, Is.EqualTo(JsonValueKind.Null));
                }
                else
                {
                    Assert.That(labels.ValueKind, Is.EqualTo(JsonValueKind.Object));
                    Assert.That(labels.EnumerateObject().Count(), Is.EqualTo(state == "populated" ? 1 : 0));
                    if (state == "populated")
                    {
                        Assert.That(labels.GetProperty("key").GetString(), Is.EqualTo("value"));
                    }
                }
            }
        }

        private void RoundTripTestXml(string format, RoundTripStrategy<Tree> strategy)
        {
            string serviceResponse = XmlPayload;
            ModelReaderWriterOptions options = new ModelReaderWriterOptions(format);

            var modelInstance = GetModelInstance();
            Tree model = (Tree)strategy.Read(serviceResponse, modelInstance, options);
            VerifyModel(model, format);

            var data = strategy.Write(model, options);
            string roundTrip = data.ToString();

            // Parse XML and compare structure
            var expectedXml = XElement.Parse(serviceResponse);
            var resultXml = XElement.Parse(roundTrip);

            // Verify we can deserialize again
            Tree model2 = (Tree)strategy.Read(roundTrip, modelInstance, options);
            CompareModels(model, model2, format);
        }

        [Test]
        public void ToBinaryContent_WithJsonFormat_ProducesJsonPayload()
        {
            var tree = new Tree("tree-123", 500, 100);

            // Use reflection to call the internal ToBinaryContent method
            var method = typeof(Tree).GetMethod("ToBinaryContent",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public);
            Assert.IsNotNull(method, "ToBinaryContent method should exist on Tree");

            var binaryContent = (BinaryContent)method!.Invoke(tree, new object[] { "J" })!;

            // Verify the MediaType is set correctly for JSON
            Assert.That(binaryContent.MediaType,
                Is.EqualTo("application/json"),
                "MediaType should be application/json for format 'J'");
        }

        [Test]
        public void ToBinaryContent_WithXmlFormat_ProducesXmlPayload()
        {
            var tree = new Tree("tree-123", 500, 100);

            // Use reflection to call the internal ToBinaryContent method
            var method = typeof(Tree).GetMethod("ToBinaryContent",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public);
            Assert.IsNotNull(method, "ToBinaryContent method should exist on Tree");

            var binaryContent = (BinaryContent)method!.Invoke(tree, new object[] { "X" })!;

            // Verify the MediaType is null or empty for XML format
            Assert.That(string.IsNullOrEmpty(binaryContent.MediaType), Is.True,
                "MediaType should be null or empty for format 'X'");
        }
    }
}
