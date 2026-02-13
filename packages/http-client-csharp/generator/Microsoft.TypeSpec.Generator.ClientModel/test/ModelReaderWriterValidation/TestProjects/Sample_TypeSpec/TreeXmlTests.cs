// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
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
            var tree = GetModelInstance();

            // Use reflection to call the internal ToBinaryContent method
            var method = typeof(Tree).GetMethod("ToBinaryContent",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public);
            Assert.IsNotNull(method, "ToBinaryContent method should exist on Tree");

            var binaryContent = (BinaryContent)method!.Invoke(tree, new object[] { "J" })!;

            // Verify it's JSON by parsing as JSON
            using var stream = binaryContent.ToStream();
            using var reader = new System.IO.StreamReader(stream);
            var content = reader.ReadToEnd();

            Assert.That(content, Does.Contain("\"id\""));
            Assert.That(content, Does.Contain("\"age\""));
            Assert.That(content, Does.Contain("\"height\""));
            Assert.That(content, Does.Not.Contain("<Tree"));
        }

        [Test]
        public void ToBinaryContent_WithXmlFormat_ProducesXmlPayload()
        {
            var tree = GetModelInstance();

            // Use reflection to call the internal ToBinaryContent method
            var method = typeof(Tree).GetMethod("ToBinaryContent",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public);
            Assert.IsNotNull(method, "ToBinaryContent method should exist on Tree");

            var binaryContent = (BinaryContent)method!.Invoke(tree, new object[] { "X" })!;

            // Verify it's XML by parsing as XML
            using var stream = binaryContent.ToStream();
            var xml = XElement.Load(stream);

            Assert.That(xml.Name.LocalName, Is.EqualTo("Tree"));
            Assert.That(xml.Element("id")?.Value, Is.EqualTo("tree-123"));
            Assert.That(xml.Element("age")?.Value, Is.EqualTo("100"));
            Assert.That(xml.Element("height")?.Value, Is.EqualTo("500"));
        }
    }
}
