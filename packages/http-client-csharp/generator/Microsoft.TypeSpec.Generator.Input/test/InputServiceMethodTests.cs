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
            Assert.AreSame(baseMonitor, monitor.BaseModel);

            Assert.AreEqual(2, metadata.OperationId.Count);
            var path = (InputLroOperationIdPathMetadata)metadata.OperationId[0];
            var property = (InputLroOperationIdPropertyMetadata)metadata.OperationId[1];
            Assert.AreSame(polling.Parameters.Single(p => p.Name == "id"), path.PathParameter);
            Assert.AreEqual("jobId", path.PathParameter.SerializedName);
            Assert.AreEqual("/jobs/{jobId}/status", path.PollingPath);
            Assert.AreEqual(InputOperationLinkLocation.ResponseHeader, path.Source.Location);
            Assert.AreEqual("Operation-Location", path.Source.Property.SerializedName);
            Assert.AreSame(baseMonitor.Properties.Single(p => p.Name == "jobId"), property.Property);
            Assert.AreEqual("job_id", property.Property.SerializedName);
            Assert.AreSame(property.Property, property.PropertySegments.Single());
        }

        [TestCase("simple", InputPathParameterStyle.Simple)]
        [TestCase("label", InputPathParameterStyle.Label)]
        [TestCase("matrix", InputPathParameterStyle.Matrix)]
        [TestCase("path", InputPathParameterStyle.Path)]
        [TestCase("fragment", InputPathParameterStyle.Fragment)]
        [TestCase("future-style", InputPathParameterStyle.Unknown)]
        [TestCase(null, InputPathParameterStyle.Unknown)]
        public void LoadsPollingIdPathStyle(string? style, InputPathParameterStyle expected)
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false, method: nameof(LoadsEmittedLroMetadata));
            var json = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            json = json.Replace("\"style\": \"simple\",", style == null ? "" : $"\"style\": \"{style}\",");
            var input = TypeSpecSerialization.Deserialize(json)!;
            var methods = input.Clients.Single().Methods;
            var polling = methods.Single(m => m.Name == "getStatus").Operation;
            var metadata = ((InputLongRunningServiceMethod)methods.Single(m => m.Name == "begin"))
                .LongRunningServiceMetadata;
            var selection = (InputLroOperationIdPathMetadata)metadata.OperationId[0];
            Assert.AreSame(polling.Parameters.Single(p => p.Name == "id"), selection.PathParameter);
            Assert.AreEqual(expected, selection.PathParameter.Style);
        }

        [TestCase("lro")]
        [TestCase("lropaging")]
        public void LoadsLongRunningMetadataWithTypedPathsAndOrderedIdSources(string methodKind)
        {
            var json = """
                {
                  "finalStateVia": 1,
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
                    "propertySegments": [{
                      "$id": "job", "name": "job", "serializedName": "job",
                      "type": { "kind": "string" }
                    }, { "$ref": "id" }]
                  }]
                }
                """;
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                Converters =
                {
                    new InputLongRunningServiceMetadataConverter(),
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

            Assert.AreEqual(2, metadata.OperationId.Count);
            var path = (InputLroOperationIdPathMetadata)metadata.OperationId[0];
            Assert.AreEqual(InputOperationLinkLocation.ResponseHeader, path.Source.Location);
            Assert.AreEqual("Operation-Location", path.Source.Property.SerializedName);
            Assert.AreEqual("jobId", path.PathParameter.SerializedName);
            Assert.AreEqual("/jobs/{jobId}/status", path.PollingPath);
            var property = (InputLroOperationIdPropertyMetadata)metadata.OperationId[1];
            Assert.AreEqual("jobId", property.Property.Name);
            Assert.AreEqual("job_id", property.Property.SerializedName);
            CollectionAssert.AreEqual(new[] { "job", "job_id" }, property.PropertySegments.Select(p => p.SerializedName));
            Assert.AreSame(property.Property, property.PropertySegments[1]);

            var input = TypeSpecSerialization.Deserialize($$"""
                {
                  "name": "Test",
                  "models": [{
                    "$id": "monitor", "name": "Monitor",
                    "properties": [{ "$ref": "job" }, { "$ref": "id" }]
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
            var registeredProperty = (InputLroOperationIdPropertyMetadata)registeredMetadata.OperationId[1];
            Assert.AreSame(input.Models[0].Properties[0], registeredProperty.PropertySegments[0]);
            Assert.AreSame(input.Models[0].Properties[1], registeredProperty.Property);
        }

        [TestCase(true, true)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(false, false)]
        public void ResolvesInheritedOperationIdAndPollingOperationReferences(bool pollingFirst, bool modelsFirst)
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
                    "operationId": [{
                      "kind": "path",
                      "source": { "location": "ResponseBody", "property": { "$ref": "link" } },
                      "pathParameter": {{(pollingFirst ? reference : parameter)}},
                      "pollingPath": "/jobs/{jobId}/status"
                    }, {
                      "kind": "property",
                      "property": { "$ref": "inherited" },
                      "propertySegments": [{ "$ref": "inherited" }]
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
            var path = (InputLroOperationIdPathMetadata)metadata.OperationId[0];
            var property = (InputLroOperationIdPropertyMetadata)metadata.OperationId[1];
            var baseModel = input.Models.Single(m => m.Name == "BaseMonitor");
            var monitor = input.Models.Single(m => m.Name == "Monitor");
            var startResponse = input.Models.Single(m => m.Name == "StartResponse");

            Assert.AreSame(baseModel, monitor.BaseModel);
            Assert.AreSame(baseModel.Properties[0], property.Property);
            Assert.AreSame(baseModel.Properties[0], property.PropertySegments[0]);
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
            Assert.IsEmpty(metadata.OperationId);
            Assert.IsEmpty(new InputLongRunningServiceMetadata().OperationId);
        }

        [Test]
        public void LoadsOperationIdPropertyFromUnemittedPollingModel()
        {
            var input = TypeSpecSerialization.Deserialize("""
                {
                  "name": "Test",
                  "models": [],
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
                        "operationId": [{
                          "kind": "property",
                          "property": {
                            "$id": "id", "name": "jobId", "serializedName": "job_id",
                            "type": { "kind": "string" }
                          },
                          "propertySegments": [{ "$ref": "id" }]
                        }]
                      }
                    }]
                  }]
                }
                """)!;
            var method = (InputLongRunningServiceMethod)input.Clients.Single().Methods.Single();
            var metadata = method.LongRunningServiceMetadata;
            var selection = (InputLroOperationIdPropertyMetadata)metadata.OperationId.Single();

            Assert.IsNull(selection.Property.EnclosingType);
            Assert.AreEqual("job_id", selection.Property.SerializedName);
            Assert.AreSame(selection.Property, selection.PropertySegments.Single());
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
