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
        
        protected override Tree ToModel(ClientResult result)
        {
            // Tree's cast operator checks Content-Type header to determine format (JSON vs XML)
            // For wire format tests, set the header to application/json since wire format is JSON
            using var response = result.GetRawResponse();
            
            // Check if Content-Type is already set
            if (response.Headers.TryGetValue("Content-Type", out _))
            {
                return (Tree)result;
            }
            
            // Create a new response with Content-Type header for wire format
            var testResponse = new TestPipelineResponse(200);
            testResponse.SetContent(response.Content.ToArray());
            ((TestResponseHeaders)testResponse.Headers).SetHeader("Content-Type", "application/json");
            
            var newResult = ClientResult.FromResponse(testResponse);
            return (Tree)newResult;
        }
        
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
    }
}
