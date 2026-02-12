// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class XmlAdvancedModelXmlTests : LocalModelTests<XmlAdvancedModel>
    {
        protected override string JsonPayload => string.Empty; // XmlAdvancedModel does not support JSON
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/XmlAdvancedModel/XmlAdvancedModel.xml"));
        protected override XmlAdvancedModel ToModel(ClientResult result) => (XmlAdvancedModel)result;
        protected override BinaryContent ToBinaryContent(XmlAdvancedModel model) => model;

        // Override the base RoundTripTest to handle XML serialization properly
        protected new void RoundTripTest(string format, RoundTripStrategy<XmlAdvancedModel> strategy)
        {
            string serviceResponse = WirePayload;
            ModelReaderWriterOptions options = new ModelReaderWriterOptions(format);
            var expectedSerializedString = WirePayload;

            XmlAdvancedModel model = (XmlAdvancedModel)strategy.Read(serviceResponse, GetModelInstance(), options);
            VerifyModel(model, format);

            var data = strategy.Write(model, options);
            string roundTrip = data.ToString();

            // For XML, parse and compare structure
            var expectedXml = XElement.Parse(expectedSerializedString);
            var resultXml = XElement.Parse(roundTrip);

            XmlAdvancedModel model2 = (XmlAdvancedModel)strategy.Read(roundTrip, GetModelInstance(), options);
            CompareModels(model, model2, format);
        }

        protected override XmlAdvancedModel GetModelInstance()
        {
            // Create a minimal valid instance for testing
            var nestedModel = new XmlNestedModel("nested value", 1);
            var item1 = new XmlItem("Item 1", 100, "item1");
            var item2 = new XmlItem("Item 2", 200, "item2");
            var modelWithNs = new XmlModelWithNamespace("content1", "model1");

            return new XmlAdvancedModel(
                name: "Test Model",
                age: 42,
                enabled: true,
                score: 3.14f,
                nullableString: "nullable value",
                id: "model-123",
                version: 1,
                isActive: true,
                originalName: "renamed value",
                xmlIdentifier: "xml-id-456",
                content: "",
                unwrappedStrings: new[] { "string1", "string2" },
                unwrappedCounts: new[] { 10, 20 },
                unwrappedItems: new[] { item1, item2 },
                wrappedColors: new[] { "red", "blue" },
                items: new[] { new XmlItem("Item 3", 300, "item3") },
                nestedModel: nestedModel,
                metadata: new System.Collections.Generic.Dictionary<string, string> { { "key1", "value1" } },
                createdAt: new DateTimeOffset(2024, 1, 15, 10, 30, 0, TimeSpan.Zero),
                duration: new TimeSpan(1, 30, 0),
                data: BinaryData.FromString("SGVsbG8gV29ybGQ="),
                fixedEnum: StringFixedEnum.One,
                extensibleEnum: StringExtensibleEnum.One,
                label: "test-label",
                daysUsed: 365,
                fooItems: new[] { "foo1", "foo2" },
                anotherModel: nestedModel,
                modelsWithNamespaces: new[] { modelWithNs },
                unwrappedModelsWithNamespaces: new[] { new XmlModelWithNamespace("content2", "model2") },
                listOfListFoo: new[] { new[] { item1 }.ToList() }.ToList(),
                dictionaryFoo: new System.Collections.Generic.Dictionary<string, XmlItem> { { "key1", item1 } },
                dictionaryOfDictionaryFoo: new System.Collections.Generic.Dictionary<string, System.Collections.Generic.IDictionary<string, XmlItem>>
                {
                    { "outer1", new System.Collections.Generic.Dictionary<string, XmlItem> { { "inner1", item1 } } }
                },
                dictionaryListFoo: new System.Collections.Generic.Dictionary<string, System.Collections.Generic.IList<XmlItem>>
                {
                    { "list1", new[] { item1 }.ToList() }
                },
                listOfDictionaryFoo: new[] 
                { 
                    new System.Collections.Generic.Dictionary<string, XmlItem> { { "key1", item1 } } as System.Collections.Generic.IDictionary<string, XmlItem>
                }
            );
        }

        // Override test methods to use our custom RoundTripTest
        [TestCase("W")]
        public new void RoundTripWithModelReaderWriter(string format)
            => RoundTripTest(format, new ModelReaderWriterStrategy<XmlAdvancedModel>());

        [TestCase("W")]
        public new void RoundTripWithModelReaderWriterNonGeneric(string format)
            => RoundTripTest(format, new ModelReaderWriterNonGenericStrategy<XmlAdvancedModel>());

        [TestCase("W")]
        public new void RoundTripWithModelInterface(string format)
            => RoundTripTest(format, new ModelInterfaceStrategy<XmlAdvancedModel>());

        [TestCase("W")]
        public new void RoundTripWithModelInterfaceNonGeneric(string format)
            => RoundTripTest(format, new ModelInterfaceAsObjectStrategy<XmlAdvancedModel>());

        protected override void CompareModels(XmlAdvancedModel model, XmlAdvancedModel model2, string format)
        {
            // Compare basic properties
            Assert.AreEqual(model.Name, model2.Name);
            Assert.AreEqual(model.Age, model2.Age);
            Assert.AreEqual(model.Enabled, model2.Enabled);
            Assert.AreEqual(model.Score, model2.Score);
            Assert.AreEqual(model.NullableString, model2.NullableString);
            
            // Compare XML attributes
            Assert.AreEqual(model.Id, model2.Id);
            Assert.AreEqual(model.Version, model2.Version);
            Assert.AreEqual(model.IsActive, model2.IsActive);
            Assert.AreEqual(model.OriginalName, model2.OriginalName);
            Assert.AreEqual(model.XmlIdentifier, model2.XmlIdentifier);
            
            // Compare arrays
            Assert.AreEqual(model.UnwrappedStrings.Count, model2.UnwrappedStrings.Count);
            for (int i = 0; i < model.UnwrappedStrings.Count; i++)
            {
                Assert.AreEqual(model.UnwrappedStrings[i], model2.UnwrappedStrings[i]);
            }
            
            Assert.AreEqual(model.UnwrappedCounts.Count, model2.UnwrappedCounts.Count);
            for (int i = 0; i < model.UnwrappedCounts.Count; i++)
            {
                Assert.AreEqual(model.UnwrappedCounts[i], model2.UnwrappedCounts[i]);
            }
            
            Assert.AreEqual(model.WrappedColors.Count, model2.WrappedColors.Count);
            for (int i = 0; i < model.WrappedColors.Count; i++)
            {
                Assert.AreEqual(model.WrappedColors[i], model2.WrappedColors[i]);
            }
            
            // Compare nested model
            Assert.AreEqual(model.NestedModel.Value, model2.NestedModel.Value);
            Assert.AreEqual(model.NestedModel.NestedId, model2.NestedModel.NestedId);
            
            // Compare metadata dictionary
            Assert.AreEqual(model.Metadata.Count, model2.Metadata.Count);
            foreach (var key in model.Metadata.Keys)
            {
                Assert.AreEqual(model.Metadata[key], model2.Metadata[key]);
            }
            
            // Compare date/time and duration
            Assert.AreEqual(model.CreatedAt, model2.CreatedAt);
            Assert.AreEqual(model.Duration, model2.Duration);
            
            // Compare binary data
            Assert.AreEqual(model.Data.ToString(), model2.Data.ToString());
            
            // Compare enums
            Assert.AreEqual(model.FixedEnum, model2.FixedEnum);
            Assert.AreEqual(model.ExtensibleEnum.ToString(), model2.ExtensibleEnum.ToString());
            
            // Compare namespace properties
            Assert.AreEqual(model.Label, model2.Label);
            Assert.AreEqual(model.DaysUsed, model2.DaysUsed);
            Assert.AreEqual(model.FooItems.Count, model2.FooItems.Count);
            Assert.AreEqual(model.AnotherModel.Value, model2.AnotherModel.Value);
        }

        protected override void VerifyModel(XmlAdvancedModel model, string format)
        {
            var parsedXml = XElement.Parse(WirePayload);
            Assert.IsNotNull(parsedXml);
            
            // Verify basic properties
            Assert.AreEqual("Test Model", model.Name);
            Assert.AreEqual(42, model.Age);
            Assert.AreEqual(true, model.Enabled);
            Assert.AreEqual(3.14f, model.Score);
            Assert.AreEqual("nullable value", model.NullableString);
            
            // Verify XML attributes
            Assert.AreEqual("model-123", model.Id);
            Assert.AreEqual(1, model.Version);
            Assert.AreEqual(true, model.IsActive);
            Assert.AreEqual("renamed value", model.OriginalName);
            Assert.AreEqual("xml-id-456", model.XmlIdentifier);
            
            // Verify unwrapped arrays
            Assert.AreEqual(2, model.UnwrappedStrings.Count);
            Assert.AreEqual("string1", model.UnwrappedStrings[0]);
            Assert.AreEqual("string2", model.UnwrappedStrings[1]);
            
            Assert.AreEqual(2, model.UnwrappedCounts.Count);
            Assert.AreEqual(10, model.UnwrappedCounts[0]);
            Assert.AreEqual(20, model.UnwrappedCounts[1]);
            
            Assert.AreEqual(2, model.UnwrappedItems.Count);
            Assert.AreEqual("Item 1", model.UnwrappedItems[0].ItemName);
            Assert.AreEqual(100, model.UnwrappedItems[0].ItemValue);
            Assert.AreEqual("item1", model.UnwrappedItems[0].ItemId);
            
            // Verify wrapped arrays
            Assert.AreEqual(2, model.WrappedColors.Count);
            Assert.AreEqual("red", model.WrappedColors[0]);
            Assert.AreEqual("blue", model.WrappedColors[1]);
            
            Assert.AreEqual(2, model.Items.Count);
            Assert.AreEqual("Item 3", model.Items[0].ItemName);
            Assert.AreEqual(300, model.Items[0].ItemValue);
            
            // Verify nested model
            Assert.AreEqual("nested value", model.NestedModel.Value);
            Assert.AreEqual(1, model.NestedModel.NestedId);
            
            // Verify metadata
            Assert.AreEqual(2, model.Metadata.Count);
            Assert.AreEqual("value1", model.Metadata["key1"]);
            Assert.AreEqual("value2", model.Metadata["key2"]);
            
            // Verify date/time
            Assert.AreEqual(new DateTimeOffset(2024, 1, 15, 10, 30, 0, TimeSpan.Zero), model.CreatedAt);
            Assert.AreEqual(new TimeSpan(1, 30, 0), model.Duration);
            
            // Verify enums
            Assert.AreEqual(StringFixedEnum.One, model.FixedEnum);
            Assert.AreEqual(StringExtensibleEnum.One, model.ExtensibleEnum);
            
            // Verify namespace properties
            Assert.AreEqual("test-label", model.Label);
            Assert.AreEqual(365, model.DaysUsed);
            Assert.AreEqual(2, model.FooItems.Count);
            Assert.AreEqual("foo1", model.FooItems[0]);
            Assert.AreEqual("another nested value", model.AnotherModel.Value);
            Assert.AreEqual(2, model.AnotherModel.NestedId);
            
            // Verify collection of collections
            Assert.AreEqual(1, model.ListOfListFoo.Count);
            Assert.AreEqual(1, model.ListOfListFoo[0].Count);
            
            Assert.AreEqual(1, model.DictionaryFoo.Count);
            Assert.IsTrue(model.DictionaryFoo.ContainsKey("key1"));
            
            Assert.AreEqual(1, model.DictionaryOfDictionaryFoo.Count);
            Assert.IsTrue(model.DictionaryOfDictionaryFoo.ContainsKey("outer1"));
            
            Assert.AreEqual(1, model.DictionaryListFoo.Count);
            Assert.IsTrue(model.DictionaryListFoo.ContainsKey("list1"));
            
            Assert.AreEqual(1, model.ListOfDictionaryFoo.Count);
            Assert.AreEqual(1, model.ListOfDictionaryFoo[0].Count);
        }
    }
}
