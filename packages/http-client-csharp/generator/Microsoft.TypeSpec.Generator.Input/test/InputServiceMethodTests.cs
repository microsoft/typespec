// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Linq;
using System.Text.Json.Nodes;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputServiceMethodTests
    {
        [Test]
        public void CanUpdateServiceMethodName()
        {
            var operation = InputFactory.Operation("TestOperation", "TestService");
            var serviceMethod = InputFactory.BasicServiceMethod("TestMethod", operation);
            serviceMethod.Update("UpdatedMethod");
            serviceMethod.Operation.Update("UpdatedOperation");

            Assert.AreEqual("UpdatedMethod", serviceMethod.Name);
            Assert.AreEqual("UpdatedOperation", serviceMethod.Operation.Name);
        }

        [Test]
        public void LoadsEmittedLroStatusMetadata()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var input = TypeSpecSerialization.Deserialize(File.ReadAllText(Path.Combine(directory, "tspCodeModel.json")))!;
            var metadata = ((InputLongRunningServiceMethod)input.Clients.Single().Methods.Single(m => m.Name == "begin"))
                .LongRunningServiceMetadata;
            var monitor = input.Models.Single(m => m.Name == "Monitor");
            var baseMonitor = input.Models.Single(m => m.Name == "BaseMonitor");
            var statistics = input.Models.Single(m => m.Name == "Statistics");

            Assert.AreSame(monitor, metadata.PollingResponseModel);
            CollectionAssert.AreEqual(new[] { "progress", "statistics", "updatedAt" },
                metadata.StatusMetadata.Select(selection => selection.Property.Name));
            CollectionAssert.AreEqual(new[] { "percent_complete", "statistics", "last_updated" },
                metadata.StatusMetadata.Select(selection => selection.Property.SerializedName));
            Assert.AreSame(monitor.Properties.Single(p => p.Name == "progress"), metadata.StatusMetadata[0].Property);
            Assert.AreSame(monitor.Properties.Single(p => p.Name == "statistics"), metadata.StatusMetadata[1].Property);
            Assert.AreSame(statistics, metadata.StatusMetadata[1].Property.Type);
            Assert.AreSame(baseMonitor.Properties.Single(p => p.Name == "updatedAt"), metadata.StatusMetadata[2].Property);
            foreach (var selection in metadata.StatusMetadata)
            {
                Assert.AreSame(selection.Property, selection.PropertySegments.Single());
            }
        }

        [Test]
        public void LoadsLroMetadataWithoutStatusMetadataAndSkipsUnknownProperties()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false, method: nameof(LoadsEmittedLroStatusMetadata));
            var root = JsonNode.Parse(File.ReadAllText(Path.Combine(directory, "tspCodeModel.json")))!;
            var lroMetadata = root["clients"]![0]!["methods"]!.AsArray()
                .Single(m => (string?)m!["name"] == "begin")!["lroMetadata"]!.AsObject();
            lroMetadata.Remove("pollingResponseModel");
            lroMetadata.Remove("statusMetadata");
            lroMetadata.Insert(0, "futureMetadata", new JsonObject { ["value"] = new JsonArray(1, 2) });
            var json = root.ToJsonString();
            var input = TypeSpecSerialization.Deserialize(json)!;
            var metadata = ((InputLongRunningServiceMethod)input.Clients.Single().Methods.Single(m => m.Name == "begin"))
                .LongRunningServiceMetadata;

            Assert.IsNull(metadata.PollingResponseModel);
            Assert.IsEmpty(metadata.StatusMetadata);
            Assert.AreEqual(3, metadata.FinalStateVia);
        }
    }
}
