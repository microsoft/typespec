// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputServiceMethodTests
    {
        [Test]
        public void LoadsEmittedLroMetadata()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var input = TypeSpecSerialization.Deserialize(File.ReadAllText(Path.Combine(directory, "tspCodeModel.json")))!;
            var methods = input.Clients.Single().Methods;
            var polling = methods.Single(m => m.Name == "getStatus").Operation;
            var metadata = ((InputLongRunningServiceMethod)methods.Single(m => m.Name == "begin"))
                .LongRunningServiceMetadata;
            var monitor = input.Models.Single(m => m.Name == "Monitor");
            var baseMonitor = input.Models.Single(m => m.Name == "BaseMonitor");
            var statistics = input.Models.Single(m => m.Name == "Statistics");

            Assert.AreSame(monitor, metadata.PollingResponseModel);
            Assert.AreSame(baseMonitor, monitor.BaseModel);
            CollectionAssert.AreEqual(new[] { "progress", "statistics", "updatedAt" },
                metadata.StatusMetadata.Select(selection => selection.Property.Name));
            CollectionAssert.AreEqual(new[] { "percent_complete", "statistics", "last_updated" },
                metadata.StatusMetadata.Select(selection => selection.PropertySegments.Single().SerializedName));
            Assert.AreSame(monitor.Properties.Single(p => p.Name == "progress"), metadata.StatusMetadata[0].Property);
            Assert.AreSame(monitor.Properties.Single(p => p.Name == "statistics"), metadata.StatusMetadata[1].Property);
            Assert.AreSame(statistics, metadata.StatusMetadata[1].Property.Type);
            Assert.AreSame(baseMonitor.Properties.Single(p => p.Name == "updatedAt"), metadata.StatusMetadata[2].Property);
            foreach (var selection in metadata.StatusMetadata)
            {
                Assert.AreSame(selection.Property, selection.PropertySegments.Single());
            }

            Assert.AreEqual(2, metadata.OperationId.Count);
            var path = (InputLroOperationIdPathMetadata)metadata.OperationId[0];
            var property = (InputLroOperationIdPropertyMetadata)metadata.OperationId[1];
            Assert.AreSame(polling.Parameters.Single(p => p.Name == "id"), path.PathParameter);
            Assert.AreEqual("jobId", path.PathParameter.SerializedName);
            Assert.AreEqual("/jobs/{jobId}/status", path.PollingPath);
            Assert.AreEqual(InputOperationLinkLocation.ResponseHeader, path.Source.Location);
            Assert.AreEqual("Operation-Location", path.Source.Property.SerializedName);
            Assert.AreSame(monitor.Properties.Single(p => p.Name == "jobId"), property.Property);
            Assert.AreEqual("job_id", property.Property.SerializedName);
            Assert.AreSame(property.Property, property.PropertySegments.Single());
        }

        [TestCase("lro")]
        [TestCase("lropaging")]
        public void LoadsLongRunningMetadataWithTypedPathsAndOrderedIdSources(string methodKind)
        {
            var json = """
                {
                  "finalStateVia": 1,
                  "statusMetadata": [{
                    "property": {
                      "$id": "progress", "name": "progress", "serializedName": "percent_complete",
                      "optional": true, "type": { "kind": "int32" }
                    },
                    "propertySegments": [{ "$ref": "progress" }]
                  }, {
                    "property": {
                      "$id": "updated", "name": "updatedAt", "serializedName": "last_updated",
                      "optional": true, "type": { "kind": "string" }
                    },
                    "propertySegments": [{ "$ref": "progress" }, { "$ref": "updated" }]
                  }],
                  "operationId": [{
                    "kind": "path",
                    "source": {
                      "location": "ResponseHeader",
                      "property": {
                        "$id": "location", "name": "location", "serializedName": "Operation-Location",
                        "type": { "kind": "string" }
                      }
                    },
                    "pathParameter": {
                      "$id": "parameter", "kind": "path", "name": "id", "serializedName": "jobId",
                      "type": { "kind": "string" }, "scope": "method"
                    },
                    "pollingPath": "/jobs/{jobId}/status"
                  }, {
                    "kind": "property",
                    "property": {
                      "$id": "id", "name": "jobId", "serializedName": "job_id",
                      "type": { "kind": "string" }
                    },
                    "propertySegments": [{ "$ref": "id" }]
                  }]
                }
                """;
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                Converters =
                {
                    new InputLongRunningServiceMetadataConverter(),
                    new InputLroStatusMetadataConverter(),
                    new InputLroOperationIdMetadataConverter(),
                    new InputOperationLinkConverter(),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputPathParameterConverter(referenceHandler),
                    new System.Text.Json.Serialization.JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                }
            };
            var metadata = JsonSerializer.Deserialize<InputLongRunningServiceMetadata>(json, options)!;

            Assert.AreEqual(2, metadata.StatusMetadata.Count);
            Assert.AreEqual("progress", metadata.StatusMetadata[0].Property.Name);
            Assert.IsFalse(metadata.StatusMetadata[0].Property.IsRequired);
            Assert.AreEqual("percent_complete", metadata.StatusMetadata[0].Property.SerializedName);
            Assert.AreSame(metadata.StatusMetadata[0].Property, metadata.StatusMetadata[0].PropertySegments[0]);
            Assert.AreSame(metadata.StatusMetadata[0].Property, metadata.StatusMetadata[1].PropertySegments[0]);
            Assert.AreSame(metadata.StatusMetadata[1].Property, metadata.StatusMetadata[1].PropertySegments[1]);
            Assert.AreEqual(2, metadata.OperationId.Count);
            var path = (InputLroOperationIdPathMetadata)metadata.OperationId[0];
            Assert.AreEqual(InputOperationLinkLocation.ResponseHeader, path.Source.Location);
            Assert.AreEqual("Operation-Location", path.Source.Property.SerializedName);
            Assert.AreEqual("jobId", path.PathParameter.SerializedName);
            Assert.AreEqual("/jobs/{jobId}/status", path.PollingPath);
            var property = (InputLroOperationIdPropertyMetadata)metadata.OperationId[1];
            Assert.AreEqual("jobId", property.Property.Name);
            Assert.AreEqual("job_id", property.Property.SerializedName);
            Assert.AreSame(property.Property, property.PropertySegments[0]);

            var input = TypeSpecSerialization.Deserialize($$"""
                {
                  "name": "Test",
                  "models": [{
                    "$id": "monitor", "name": "Monitor",
                    "properties": [{ "$ref": "progress" }, { "$ref": "updated" }, { "$ref": "id" }]
                  }],
                  "clients": [{
                    "$id": "client", "name": "TestClient",
                    "methods": [{
                      "$id": "begin", "kind": "{{methodKind}}", "name": "begin",
                      "crossLanguageDefinitionId": "Test.begin",
                      "operation": {
                        "$id": "operation", "name": "begin", "httpMethod": "POST",
                        "uri": "https://example.com", "path": "/jobs",
                        "crossLanguageDefinitionId": "Test.begin"
                      },
                      "response": {},
                      "pagingMetadata": { "itemPropertySegments": ["items"] },
                      "lroMetadata": {{json}}
                    }]
                  }]
                }
                """)!;
            var method = input.Clients.Single().Methods.Single();
            var registeredMetadata = method is InputLongRunningServiceMethod lro
                ? lro.LongRunningServiceMetadata
                : ((InputLongRunningPagingServiceMethod)method).LongRunningServiceMetadata;
            Assert.AreSame(input.Models[0].Properties[0], registeredMetadata.StatusMetadata[0].Property);
            Assert.AreSame(input.Models[0].Properties[1], registeredMetadata.StatusMetadata[1].Property);
            Assert.AreSame(input.Models[0].Properties[2],
                ((InputLroOperationIdPropertyMetadata)registeredMetadata.OperationId[1]).Property);
        }

        [TestCase(true, true)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(false, false)]
        public void ResolvesInheritedStatusAndPollingOperationReferences(bool pollingFirst, bool modelsFirst)
        {
            const string parameter = """
                {
                  "$id": "jobId", "kind": "path", "name": "id", "serializedName": "jobId",
                  "type": { "kind": "string" }, "scope": "method"
                }
                """;
            const string reference = """{ "$ref": "jobId" }""";
            var pollingMethod = $$"""
                {
                  "$id": "poll", "kind": "basic", "name": "getStatus",
                  "crossLanguageDefinitionId": "Test.getStatus",
                  "operation": {
                    "$id": "polling", "name": "getStatus", "httpMethod": "GET",
                    "uri": "https://example.com", "path": "/jobs/{jobId}/status",
                    "crossLanguageDefinitionId": "Test.getStatus",
                    "parameters": [{{(pollingFirst ? parameter : reference)}}]
                  },
                  "response": {}
                }
                """;
            var beginMethod = $$"""
                {
                  "$id": "begin", "kind": "lro", "name": "begin",
                  "crossLanguageDefinitionId": "Test.begin",
                  "operation": {
                    "$id": "start", "name": "begin", "httpMethod": "POST",
                    "uri": "https://example.com", "path": "/jobs",
                    "crossLanguageDefinitionId": "Test.begin"
                  },
                  "response": {},
                  "lroMetadata": {
                    "finalStateVia": 1,
                    "pollingResponseModel": { "$ref": "monitor" },
                    "statusMetadata": [{
                      "property": { "$ref": "inherited" },
                      "propertySegments": [{ "$ref": "inherited" }]
                    }],
                    "operationId": [{
                      "kind": "path",
                      "source": { "location": "ResponseBody", "property": { "$ref": "link" } },
                      "pathParameter": {{(pollingFirst ? reference : parameter)}},
                      "pollingPath": "/jobs/{jobId}/status"
                    }]
                  }
                }
                """;
            var methodsJson = pollingFirst
                ? $"{pollingMethod}, {beginMethod}"
                : $"{beginMethod}, {pollingMethod}";
            const string modelsJson = """
                  "models": [{
                    "$id": "base", "name": "BaseMonitor",
                    "properties": [{
                      "$id": "inherited", "name": "updated", "serializedName": "updated_at",
                      "type": { "kind": "string" }
                    }]
                  }, {
                    "$id": "monitor", "name": "Monitor", "baseModel": { "$ref": "base" },
                    "properties": []
                  }, {
                    "$id": "startResponse", "name": "StartResponse",
                    "properties": [{
                      "$id": "link", "name": "location", "serializedName": "location",
                      "type": { "kind": "string" }
                    }]
                  }]
                """;
            var clientsJson = $$"""
                  "clients": [{
                    "$id": "client", "name": "TestClient",
                    "methods": [{{methodsJson}}]
                  }]
                """;
            var input = TypeSpecSerialization.Deserialize($$"""
                {
                  "name": "Test",
                  {{(modelsFirst ? $"{modelsJson}, {clientsJson}" : $"{clientsJson}, {modelsJson}")}}
                }
                """)!;

            var methods = input.Clients.Single().Methods;
            var pollingOperation = methods.Single(m => m.Name == "getStatus").Operation;
            var metadata = ((InputLongRunningServiceMethod)methods.Single(m => m.Name == "begin"))
                .LongRunningServiceMetadata;
            var path = (InputLroOperationIdPathMetadata)metadata.OperationId.Single();
            var baseModel = input.Models.Single(m => m.Name == "BaseMonitor");
            var monitor = input.Models.Single(m => m.Name == "Monitor");
            var startResponse = input.Models.Single(m => m.Name == "StartResponse");

            Assert.AreSame(baseModel, monitor.BaseModel);
            Assert.AreSame(monitor, metadata.PollingResponseModel);
            Assert.AreSame(baseModel.Properties[0], metadata.StatusMetadata[0].Property);
            Assert.AreSame(baseModel.Properties[0], metadata.StatusMetadata[0].PropertySegments[0]);
            Assert.AreSame(startResponse.Properties[0], path.Source.Property);
            Assert.AreSame(pollingOperation.Parameters.Single(), path.PathParameter);
        }

        [TestCase("ResponseHeader", InputOperationLinkLocation.ResponseHeader)]
        [TestCase("ResponseBody", InputOperationLinkLocation.ResponseBody)]
        [TestCase("Self", InputOperationLinkLocation.Self)]
        [TestCase("FutureLocation", InputOperationLinkLocation.Unknown)]
        public void LoadsOperationLinkLocations(string location, InputOperationLinkLocation expected)
        {
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                Converters =
                {
                    new InputOperationLinkConverter(),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                }
            };
            var link = JsonSerializer.Deserialize<InputOperationLink>($$"""
                {
                  "location": "{{location}}",
                  "property": { "$id": "link", "name": "link", "type": { "kind": "string" } }
                }
                """, options)!;

            Assert.AreEqual(expected, link.Location);
        }

        [TestCase("""{}""")]
        [TestCase("""{ "location": null }""")]
        public void RejectsOperationLinkWithoutLocation(string json)
        {
            var options = new JsonSerializerOptions
            {
                Converters = { new InputOperationLinkConverter() }
            };
            Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<InputOperationLink>(json, options));
        }

        [TestCase("""{"kind":"future"}""")]
        [TestCase("""{"kind":"path"}""")]
        [TestCase("""{"kind":"property","propertySegments":[]}""")]
        public void RejectsInvalidOperationIdMetadata(string json)
        {
            var options = new JsonSerializerOptions
            {
                Converters = { new InputLroOperationIdMetadataConverter() }
            };
            Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<InputLroOperationIdMetadata>(json, options));
        }

        [Test]
        public void LoadsLegacyLongRunningMetadataWithoutSelections()
        {
            var options = new JsonSerializerOptions
            {
                Converters = { new InputLongRunningServiceMetadataConverter() }
            };
            var metadata = JsonSerializer.Deserialize<InputLongRunningServiceMetadata>(
                """{ "futureMetadata": { "values": [1, 2] }, "finalStateVia": 2, "resultPath": "result" }""", options)!;

            Assert.AreEqual(2, metadata.FinalStateVia);
            Assert.AreEqual("result", metadata.ResultPath);
            Assert.IsEmpty(metadata.StatusMetadata);
            Assert.IsEmpty(metadata.OperationId);
            Assert.IsNull(metadata.PollingResponseModel);
            Assert.IsEmpty(new InputLongRunningServiceMetadata().StatusMetadata);
        }

        [Test]
        public void LoadsSelectedModelPropertyWithoutPollingResponseModel()
        {
            var input = TypeSpecSerialization.Deserialize("""
                {
                  "name": "Test",
                  "models": [{
                    "$id": "detailsModel", "name": "Details",
                    "properties": [{ "$id": "value", "name": "value", "type": { "kind": "string" } }]
                  }],
                  "clients": [{
                    "$id": "client", "name": "TestClient",
                    "methods": [{
                      "$id": "begin", "kind": "lro", "name": "begin",
                      "crossLanguageDefinitionId": "Test.begin",
                      "operation": {
                        "$id": "operation", "name": "begin", "httpMethod": "POST",
                        "uri": "https://example.com", "path": "/jobs",
                        "crossLanguageDefinitionId": "Test.begin"
                      },
                      "response": {},
                      "lroMetadata": {
                        "finalStateVia": 1,
                        "statusMetadata": [{
                          "property": {
                            "$id": "details", "name": "details", "serializedName": "details",
                            "optional": true, "type": { "$ref": "detailsModel" }
                          },
                          "propertySegments": [{ "$ref": "details" }]
                        }]
                      }
                    }]
                  }]
                }
                """)!;
            var method = (InputLongRunningServiceMethod)input.Clients.Single().Methods.Single();
            var metadata = method.LongRunningServiceMetadata;
            var selection = metadata.StatusMetadata.Single();

            Assert.IsNull(metadata.PollingResponseModel);
            Assert.IsNull(selection.Property.EnclosingType);
            Assert.AreSame(selection.Property, selection.PropertySegments.Single());
            Assert.AreSame(input.Models.Single(), selection.Property.Type);
        }

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

    }
}
