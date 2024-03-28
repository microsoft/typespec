// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using ModelReaderWriterValidationTypeSpec.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    internal class AvailabilitySetDataTests : ModelJsonTests<AvailabilitySetData>
    {
        protected override string WirePayload => File.ReadAllText(TestData.GetLocation("AvailabilitySetData/AvailabilitySetDataWireFormat.json")).TrimEnd();

        protected override string JsonPayload => WirePayload;

        protected override string GetExpectedResult(string format)
        {
            object obj = format switch
            {
                "J" => new
                {
                    name = "testAS-3375",
                    id = "/subscriptions/e37510d7-33b6-4676-886f-ee75bcc01871/resourceGroups/testRG-6497/providers/Microsoft.Compute/availabilitySets/testAS-3375",
                    type = "Microsoft.Compute/availabilitySets",
                    sku = new
                    {
                        name = "Classic"
                    },
                    tags = new Dictionary<string, string>
                    {
                        ["key"] = "value"
                    },
                    location = "eastus",
                    properties = new
                    {
                        platformUpdateDomainCount = 5,
                        platformFaultDomainCount = 3
                    },
                    extraSku = "extraSku",
                    extraRoot = "extraRoot"
                },
                _ => new
                {
                    sku = new
                    {
                        name = "Classic"
                    },
                    tags = new Dictionary<string, string>
                    {
                        ["key"] = "value"
                    },
                    location = "eastus",
                    properties = new
                    {
                        platformUpdateDomainCount = 5,
                        platformFaultDomainCount = 3
                    }
                }
            };
            return JsonSerializer.Serialize(obj);
        }

        protected override void VerifyModel(AvailabilitySetData model, string format)
        {
            Dictionary<string, string> expectedTags = new Dictionary<string, string>() { { "key", "value" } };

            Assert.AreEqual("/subscriptions/e37510d7-33b6-4676-886f-ee75bcc01871/resourceGroups/testRG-6497/providers/Microsoft.Compute/availabilitySets/testAS-3375", model.Id.ToString());
            CollectionAssert.AreEquivalent(expectedTags, model.Tags);
            Assert.AreEqual("eastus", model.Location);
            Assert.AreEqual("testAS-3375", model.Name);
            Assert.AreEqual("Microsoft.Compute/availabilitySets", model.ResourceType.ToString());
            Assert.AreEqual(5, model.Properties.PlatformUpdateDomainCount);
            Assert.AreEqual(3, model.Properties.PlatformFaultDomainCount);
            Assert.AreEqual("Classic", model.Sku.Name);
        }

        protected override void CompareModels(AvailabilitySetData model, AvailabilitySetData model2, string format)
        {
            Assert.AreEqual(format == "W" ? null : model.Id, model2.Id);
            Assert.AreEqual(model.Location, model2.Location);
            Assert.AreEqual(format == "W" ? null : model.Name, model2.Name);
            Assert.AreEqual(model.Properties.PlatformFaultDomainCount, model2.Properties.PlatformFaultDomainCount);
            Assert.AreEqual(model.Properties.PlatformUpdateDomainCount, model2.Properties.PlatformUpdateDomainCount);
            if (format == "J")
                Assert.AreEqual(model.ResourceType, model2.ResourceType);
            CollectionAssert.AreEquivalent(model.Tags, model2.Tags);
            Assert.AreEqual(model.Sku.Name, model2.Sku.Name);
        }
    }
}
