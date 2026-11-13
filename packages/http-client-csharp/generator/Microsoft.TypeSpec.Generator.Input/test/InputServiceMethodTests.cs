// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputServiceMethodTests
    {
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
            Assert.AreEqual("ResponseHeader", path.Source.Location);
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
            Assert.IsEmpty(new InputLongRunningServiceMetadata().StatusMetadata);
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
