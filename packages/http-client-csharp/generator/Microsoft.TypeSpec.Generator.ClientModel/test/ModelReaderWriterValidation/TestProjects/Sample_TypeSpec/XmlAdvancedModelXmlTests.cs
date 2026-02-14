// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.IO;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    /// <summary>
    /// Tests for XmlAdvancedModel XML serialization.
    /// Since XmlAdvancedModel is XML-only, it extends LocalModelXmlTests.
    /// </summary>
    internal class XmlAdvancedModelXmlTests : LocalModelXmlTests<XmlAdvancedModel>
    {
        protected override string JsonPayload => string.Empty; // XmlAdvancedModel does not support JSON
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/XmlAdvancedModel/XmlAdvancedModel.xml"));
        protected override string XmlPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/XmlAdvancedModel/XmlAdvancedModel.xml"));
        protected override XmlAdvancedModel ToModel(ClientResult result) => (XmlAdvancedModel)result;
        protected override BinaryContent ToBinaryContent(XmlAdvancedModel model) => model;

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
            Assert.AreEqual(model.WrappedColors.Count, model2.WrappedColors.Count);

            // Compare nested model (NestedId not preserved - WriteObjectValue limitation)
            Assert.AreEqual(model.NestedModel.Value, model2.NestedModel.Value);

            // Compare metadata dictionary
            Assert.AreEqual(model.Metadata.Count, model2.Metadata.Count);

            // Compare date/time and duration
            Assert.AreEqual(model.CreatedAt, model2.CreatedAt);
            Assert.AreEqual(model.Duration, model2.Duration);

            // Compare enums
            Assert.AreEqual(model.FixedEnum, model2.FixedEnum);
            Assert.AreEqual(model.ExtensibleEnum.ToString(), model2.ExtensibleEnum.ToString());

            // Compare namespace properties
            Assert.AreEqual(model.Label, model2.Label);
            Assert.AreEqual(model.DaysUsed, model2.DaysUsed);
        }

        protected override void VerifyModel(XmlAdvancedModel model, string format)
        {
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

            // Verify nested model
            Assert.AreEqual("nested value", model.NestedModel.Value);
            // Note: NestedId defaults to 0 (not in XML, attributes not preserved)

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
        }
    }
}
