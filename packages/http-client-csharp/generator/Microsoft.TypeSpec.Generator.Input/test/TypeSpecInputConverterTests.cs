using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class TypeSpecInputConverterTests
    {
        [TestCase("model", "\"properties\": []")]
        [TestCase("enum", "\"values\": [], \"valueType\": {\"kind\":\"string\"}")]
        [TestCase("string", "\"crossLanguageDefinitionId\": \"External.Value\"")]
        [TestCase("union", "\"variantTypes\": [{\"kind\":\"string\"}, {\"kind\":\"int32\"}]")]
        [TestCase("array", "\"valueType\": {\"kind\":\"string\"}")]
        [TestCase("dict", "\"keyType\": {\"kind\":\"string\"}, \"valueType\": {\"kind\":\"string\"}")]
        [TestCase("nullable", "\"type\": {\"kind\":\"string\"}")]
        [TestCase("utcDateTime", "\"crossLanguageDefinitionId\":\"External.Value\", \"encode\":\"rfc3339\", \"wireType\":{\"kind\":\"string\"}")]
        [TestCase("duration", "\"crossLanguageDefinitionId\":\"External.Value\", \"encode\":\"ISO8601\", \"wireType\":{\"kind\":\"string\"}")]
        public void LoadsExperimentalExternalTypes(string kind, string typeProperties)
        {
            var content = $$"""
                {
                  "name": "Test",
                  "models": [{
                    "$id": "wrapper", "name": "Wrapper",
                    "properties": [{
                      "$id": "property", "name": "value",
                      "type": {
                        "$id": "external", "kind": "{{kind}}", "name": "External",
                        {{typeProperties}},
                        "external": {"identity":"External.Value"},
                        "experimental": {"diagnosticId":"EXTERNAL001","dependsOn":["DEP001"]}
                      }
                    }]
                  }]
                }
                """;
            var type = TypeSpecSerialization.Deserialize(content)!.Models.Single().Properties.Single().Type;
            Assert.AreEqual("External.Value", type.External?.Identity);
            Assert.AreEqual("EXTERNAL001", type.Experimental?.DiagnosticId);
            CollectionAssert.AreEqual(new[] { "DEP001" }, type.Experimental!.DependsOn);
            Assert.IsNull(InputPrimitiveType.String.Experimental);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void LoadsExperimentalTypesAndMembers(bool annotated)
        {
            string Metadata(string id) => annotated
                ? $"\"experimental\": {{\"diagnosticId\":\"{id}\",\"dependsOn\":[\"DEP001\"]}},"
                : "";
            var content = $$"""
                {
                  "name": "Test",
                  "models": [{
                    "$id": "model", "name": "Payload", {{Metadata("MODEL001")}}
                    "properties": [{
                      "$id": "property", "name": "value", {{Metadata("PROPERTY001")}}
                      "type": {"kind":"string"}
                    }]
                  }],
                  "enums": [{
                    "$id": "enum", "name": "Choice", {{Metadata("ENUM001")}}
                    "valueType": {"kind":"string"},
                    "values": [{
                      "$id": "value", "name": "One", "value": "one", {{Metadata("VALUE001")}}
                      "valueType": {"kind":"string"}, "enumType": {"$ref":"enum"}
                    }]
                  }],
                  "clients": [{
                    "$id": "client", "name": "TestClient", {{Metadata("CLIENT001")}}
                    "methods": []
                  }]
                }
                """;
            var input = TypeSpecSerialization.Deserialize(content)!;
            var details = new[]
            {
                input.Models[0].Experimental,
                input.Models[0].Properties[0].Experimental,
                input.Enums[0].Experimental,
                input.Enums[0].Values[0].Experimental,
                input.Clients[0].Experimental
            };
            if (annotated)
            {
                CollectionAssert.AreEqual(
                    new[] { "MODEL001", "PROPERTY001", "ENUM001", "VALUE001", "CLIENT001" },
                    details.Select(d => d?.DiagnosticId));
                Assert.IsTrue(details.All(d => d!.DependsOn.SequenceEqual(["DEP001"])));
            }
            else
            {
                Assert.IsTrue(details.All(d => d is null));
            }
        }

        [TestCase("""{"diagnosticId":"C","dependsOn":["A","B"]}""", "C", new[] { "A", "B" })]
        [TestCase("""{"diagnosticId":"C"}""", "C", new string[0])]
        [TestCase("""{"dependsOn":["A"]}""", null, new[] { "A" })]
        [TestCase("""{}""", null, new string[0])]
        [TestCase("""null""", null, null)]
        [TestCase(null, null, null)]
        public void LoadsExperimentalOperationDetails(string? experimental, string? diagnosticId, string[]? dependencies)
        {
            var content = $$"""
                {
                  "$id": "operation",
                  "name": "bar",
                  "httpMethod": "GET",
                  "uri": "",
                  "path": "",
                  {{(experimental is null ? "" : $@"""experimental"": {experimental},")}}
                  "crossLanguageDefinitionId": "Test.bar"
                }
                """;
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                ReferenceHandler = referenceHandler,
                Converters = { new InputOperationConverter(referenceHandler) }
            };

            var operation = JsonSerializer.Deserialize<InputOperation>(content, options)!;

            if (dependencies is null)
            {
                Assert.IsNull(operation.Experimental);
            }
            else
            {
                Assert.IsNotNull(operation.Experimental);
                Assert.AreEqual(diagnosticId, operation.Experimental!.DiagnosticId);
                CollectionAssert.AreEqual(dependencies, operation.Experimental.DependsOn);
            }
        }

        [TestCase(true)]
        [TestCase(false)]
        public void LoadsReferencesDefinedInDecoratorArguments(bool definitionsFirst)
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            using var document = JsonDocument.Parse(content);
            var root = document.RootElement;
            if (!definitionsFirst)
            {
                content = $$"""
                    {
                      "name": "Test",
                      "models": {{root.GetProperty("models").GetRawText()}},
                      "enums": {{root.GetProperty("enums").GetRawText()}},
                      "clients": {{root.GetProperty("clients").GetRawText()}}
                    }
                    """;
            }

            var inputNamespace = TypeSpecSerialization.Deserialize(content)!;
            var sharedModel = inputNamespace.Models[1];
            var owner = inputNamespace.Models[0];
            var enumType = inputNamespace.Enums.Single();

            Assert.AreEqual("SharedModel", sharedModel.Name);
            Assert.AreSame(sharedModel, inputNamespace.Models[2]);
            Assert.AreSame(sharedModel.Properties[0], owner.Properties[0]);
            Assert.AreSame(owner, sharedModel.Properties[1].Type);
            Assert.AreSame(owner, owner.Properties[1].Type);
            Assert.AreSame(sharedModel, owner.Properties[2].Type);
            Assert.AreSame(enumType, owner.Properties[3].Type);
            Assert.AreSame(sharedModel.Properties[0].Type, enumType.ValueType);

            var client = inputNamespace.Clients.Single();
            Assert.AreEqual("Test", client.Namespace);
            var decorator = client.Decorators.Single();
            Assert.AreEqual("example", decorator.Name);
            foreach (var argument in root.GetProperty("clients")[0].GetProperty("decorators")[0].GetProperty("arguments").EnumerateObject())
            {
                Assert.AreEqual(argument.Value.GetRawText(), decorator.Arguments![argument.Name].ToString());
            }
        }

        [Test]
        public void LoadsForwardReferenceWithoutDuplicatingDefinition()
        {
            const string content = """
                {
                  "name": "Test",
                  "models": [
                    { "$ref": "model" },
                    { "$id": "model", "name": "SharedModel", "properties": [] },
                    { "$ref": "model" }
                  ]
                }
                """;

            var inputNamespace = TypeSpecSerialization.Deserialize(content)!;

            Assert.AreEqual("SharedModel", inputNamespace.Models[0].Name);
            Assert.AreSame(inputNamespace.Models[0], inputNamespace.Models[1]);
            Assert.AreSame(inputNamespace.Models[0], inputNamespace.Models[2]);
        }

        [TestCase("array", "valueType", true)]
        [TestCase("array", "valueType", false)]
        [TestCase("dict", "valueType", true)]
        [TestCase("dict", "valueType", false)]
        [TestCase("nullable", "type", true)]
        [TestCase("nullable", "type", false)]
        public void LoadsRecursiveDecoratorTypeBeforeContainingModel(string kind, string valueProperty, bool definitionInDecorator)
        {
            var keyType = kind == "dict" ? """
                "keyType": { "kind": "string" },
                """ : "";
            var wrapper = $$"""
                {
                  "$id": "wrapper",
                  "kind": "{{kind}}",
                  {{keyType}}
                  "{{valueProperty}}": { "$ref": "node" }
                }
                """;
            const string reference = """{ "$ref": "wrapper" }""";
            var content = $$"""
                {
                  "name": "Test",
                  "models": [
                    {
                      "$id": "owner",
                      "name": "Owner",
                      "decorators": [{
                        "name": "example",
                        "arguments": {
                          "value": {
                            "$id": "node",
                            "kind": "model",
                            "name": "Node",
                            "properties": [{
                              "$id": "children",
                              "name": "children",
                              "type": {{(definitionInDecorator ? wrapper : reference)}}
                            }]
                          }
                        }
                      }],
                      "properties": [{
                        "$id": "nodes",
                        "name": "nodes",
                        "type": {{(definitionInDecorator ? reference : wrapper)}}
                      }]
                    },
                    { "$ref": "node" }
                  ]
                }
                """;

            var inputNamespace = TypeSpecSerialization.Deserialize(content)!;
            var node = inputNamespace.Models[1];
            var wrapperType = inputNamespace.Models[0].Properties[0].Type;
            var wrappedType = wrapperType switch
            {
                InputArrayType array => array.ValueType,
                InputDictionaryType dictionary => dictionary.ValueType,
                InputNullableType nullable => nullable.Type,
                _ => null
            };

            Assert.AreSame(node, wrappedType);
            Assert.AreSame(wrapperType, node.Properties[0].Type);
        }

        [TestCase("array", "valueType")]
        [TestCase("dict", "valueType")]
        [TestCase("nullable", "type")]
        public void LoadsRecursiveModelInsideDecoratorWrapper(string kind, string valueProperty)
        {
            var keyType = kind == "dict" ? """
                "keyType": { "kind": "string" },
                """ : "";
            var content = $$"""
                {
                  "name": "Test",
                  "models": [
                    {
                      "$id": "owner",
                      "name": "Owner",
                      "decorators": [{
                        "name": "example",
                        "arguments": {
                          "value": {
                            "$id": "wrapper",
                            "kind": "{{kind}}",
                            {{keyType}}
                            "{{valueProperty}}": {
                              "$id": "node",
                              "kind": "model",
                              "name": "Node",
                              "properties": [{
                                "$id": "children",
                                "name": "children",
                                "type": { "$ref": "wrapper" }
                              }]
                            }
                          }
                        }
                      }],
                      "additionalProperties": { "$ref": "wrapper" }
                    },
                    { "$ref": "node" }
                  ]
                }
                """;

            var inputNamespace = TypeSpecSerialization.Deserialize(content)!;
            var node = inputNamespace.Models[1];
            var wrapperType = inputNamespace.Models[0].AdditionalProperties;
            var wrappedType = wrapperType switch
            {
                InputArrayType array => array.ValueType,
                InputDictionaryType dictionary => dictionary.ValueType,
                InputNullableType nullable => nullable.Type,
                _ => null
            };

            Assert.AreSame(node, wrappedType);
            Assert.AreSame(wrapperType, node.Properties[0].Type);
        }

        [Test]
        public void LoadsLateRegisteringCycleFromDecoratorArgument()
        {
            const string content = """
                {
                  "name": "Test",
                  "models": [{
                    "$id": "owner",
                    "name": "Owner",
                    "decorators": [{
                      "name": "example",
                      "arguments": {
                        "value": {
                          "$id": "array",
                          "kind": "array",
                          "valueType": {
                            "$id": "node",
                            "kind": "model",
                            "name": "Node",
                            "properties": [{
                              "$id": "children",
                              "name": "children",
                              "type": { "$ref": "array" }
                            }]
                          }
                        }
                      }
                    }],
                    "additionalProperties": { "$ref": "array" }
                  },
                  { "$ref": "node" }]
                }
                """;

            var inputNamespace = TypeSpecSerialization.Deserialize(content)!;
            var array = inputNamespace.Models[0].AdditionalProperties as InputArrayType
                ?? throw new AssertionException("Expected an array type.");
            var node = inputNamespace.Models[1];

            Assert.AreSame(node, array.ValueType);
            Assert.AreSame(array, node.Properties[0].Type);
        }

        [Test]
        public void LoadsReferenceDefinedInUnknownProperty()
        {
            const string content = """
                {
                  "name": "Test",
                  "extension": {
                    "nested": [{ "$id": "model", "name": "SharedModel" }]
                  },
                  "models": [{ "$ref": "model" }],
                }
                """;

            var inputNamespace = TypeSpecSerialization.Deserialize(content)!;

            Assert.AreEqual("SharedModel", inputNamespace.Models.Single().Name);
        }

        [Test]
        public void UnresolvedReferenceStillThrows()
        {
            const string content = """
                { "name": "Test", "models": [{ "$ref": "missing" }] }
                """;

            var exception = Assert.Throws<JsonException>(() => TypeSpecSerialization.Deserialize(content));

            Assert.That(exception!.Message, Does.Contain("cannot resolve reference missing"));
        }

        [Test]
        public void DuplicateReferenceDefinitionsStillThrow()
        {
            const string content = """
                {
                  "name": "Test",
                  "models": [
                    { "$id": "duplicate", "name": "First" },
                    { "$id": "duplicate", "name": "Second" }
                  ]
                }
                """;

            var exception = Assert.Throws<JsonException>(() => TypeSpecSerialization.Deserialize(content));

            Assert.That(exception!.Message, Does.Contain("duplicate"));
        }

        [Test]
        public void ReferenceWithAdditionalPropertiesStillThrows()
        {
            const string content = """
                {
                  "name": "Test",
                  "models": [
                    { "$id": "model", "name": "SharedModel" },
                    { "$ref": "model", "name": "Invalid" }
                  ]
                }
                """;

            var exception = Assert.Throws<JsonException>(() => TypeSpecSerialization.Deserialize(content));

            Assert.That(exception!.Message, Does.Contain("$ref should be the only property"));
        }

        [Test]
        public void UnresolvableReferenceCycleThrows()
        {
            const string content = """
                {
                  "name": "Test",
                  "extension": {
                    "$id": "array",
                    "kind": "array",
                    "valueType": { "$ref": "array" }
                  },
                  "models": [{
                    "$id": "model",
                    "name": "Model",
                    "additionalProperties": { "$ref": "array" }
                  }]
                }
                """;

            var exception = Assert.Throws<JsonException>(() => TypeSpecSerialization.Deserialize(content));

            Assert.That(exception!.Message, Does.Contain("circular reference"));
        }

        [Test]
        public void ExcessiveReferenceDepthThrows()
        {
            var definitions = string.Join(",", Enumerable.Range(0, 130).Select(i => $$"""
                {
                  "$id": "{{i}}",
                  "name": "Model{{i}}",
                  "baseModel": { "$ref": "{{i + 1}}" }
                }
                """));
            var content = $$"""
                {
                  "name": "Test",
                  "extension": [{{definitions}}, { "$id": "130", "name": "End" }],
                  "models": [{ "$ref": "0" }]
                }
                """;

            var exception = Assert.Throws<JsonException>(() => TypeSpecSerialization.Deserialize(content));

            Assert.That(exception!.Message, Does.Contain("maximum reference depth"));
        }

        [TestCase(100)]
        [TestCase(130)]
        public void ReferenceIndexRespectsDocumentDepth(int depth)
        {
            var content = """{ "name": "Test", "extension": """ + new string('[', depth) + "0" + new string(']', depth) + "}";

            if (depth < 128)
            {
                Assert.IsNotNull(TypeSpecSerialization.Deserialize(content));
            }
            else
            {
                Assert.Catch<JsonException>(() => TypeSpecSerialization.Deserialize(content));
            }
        }

        [TestCase("\"raw\"")]
        [TestCase("42")]
        [TestCase("null")]
        public void ReadingRawJsonDoesNotResolveReferenceMetadata(string id)
        {
            var content = $$"""{ "$id": {{id}}, "name": "Raw" }""";
            using var document = JsonDocument.Parse(content);
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions { ReferenceHandler = referenceHandler, MaxDepth = 128 };
            referenceHandler.CurrentResolver.RegisterReferenceDefinitions(document.RootElement, options);
            referenceHandler.CurrentResolver.AddReference("raw", InputFactory.Model("Raw"));
            var reader = new Utf8JsonReader(Encoding.UTF8.GetBytes(content));
            reader.Read();

            var value = reader.ReadWithConverter<JsonElement>(options);

            Assert.AreEqual(content, value.GetRawText());
        }

        [Test]
        public void LoadsPagingWithNextLink()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputPagingServiceMetadataConverter(),
                    new InputNextLinkConverter(),
                }
            };
            var pagingMetadata = JsonSerializer.Deserialize<InputPagingServiceMetadata>(content, options);
            Assert.IsNotNull(pagingMetadata);
            Assert.IsNotNull(pagingMetadata?.NextLink);
            Assert.AreEqual(1, pagingMetadata!.NextLink!.ResponseSegments.Count);
            Assert.AreEqual("next", pagingMetadata.NextLink.ResponseSegments[0]);
            Assert.AreEqual(InputResponseLocation.Body, pagingMetadata.NextLink.ResponseLocation);
        }

        [Test]
        public void LoadsPagingWithContinuationToken()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputPagingServiceMetadataConverter(),
                    new InputContinuationTokenConverter(),
                    new InputParameterConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                }
            };
            var continuationPaging = JsonSerializer.Deserialize<InputPagingServiceMetadata>(content, options);
            Assert.IsNotNull(continuationPaging);

            var continuation = continuationPaging!.ContinuationToken;
            Assert.IsNotNull(continuation);
            Assert.AreEqual(1, continuation!.ResponseSegments.Count);
            Assert.AreEqual("next-token", continuation.ResponseSegments[0]);
            Assert.AreEqual(InputResponseLocation.Header, continuation.ResponseLocation);
            Assert.AreEqual("token", continuation.Parameter.Name);
        }

        [Test]
        public void LoadsPagingWithPageSizeParameter()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputPagingServiceMetadataConverter(),
                    new InputNextLinkConverter(),
                }
            };
            var pagingMetadata = JsonSerializer.Deserialize<InputPagingServiceMetadata>(content, options);
            Assert.IsNotNull(pagingMetadata);
            Assert.IsNotNull(pagingMetadata?.PageSizeParameterSegments);
            Assert.AreEqual(1, pagingMetadata!.PageSizeParameterSegments.Count);
            Assert.AreEqual("maxpagesize", pagingMetadata.PageSizeParameterSegments[0]);
        }

        [Test]
        public void LoadsPagingWithoutPageSizeParameter()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputPagingServiceMetadataConverter(),
                    new InputNextLinkConverter(),
                }
            };
            var pagingMetadata = JsonSerializer.Deserialize<InputPagingServiceMetadata>(content, options);
            Assert.IsNotNull(pagingMetadata);
            Assert.IsNotNull(pagingMetadata?.PageSizeParameterSegments);
            Assert.AreEqual(0, pagingMetadata!.PageSizeParameterSegments.Count);
        }

        [Test]
        public void LoadsInputDurationType()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputDuration = inputType as InputDurationType;
            Assert.IsNotNull(inputDuration);
            Assert.AreEqual("constant", inputDuration!.Encode.ToString());
        }

        [Test]
        public void LoadsInputDurationTypeTranslatesDurationConstantEncoding()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputDuration = inputType as InputDurationType;
            Assert.IsNotNull(inputDuration);
            Assert.AreEqual(DurationKnownEncoding.Constant, inputDuration!.Encode);
        }

        [Test]
        public void LoadsInputDurationTypeWithConstantEncoding()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputDuration = inputType as InputDurationType;
            Assert.IsNotNull(inputDuration);
            Assert.AreEqual(DurationKnownEncoding.Constant, inputDuration!.Encode);
        }

        [Test]
        public void LoadsInputStreamingType()
        {
            const string content = """
                {
                  "$id": "1",
                  "kind": "streaming",
                  "name": "Events",
                  "crossLanguageDefinitionId": "Test.Events",
                  "valueType": {
                    "$id": "2",
                    "kind": "string",
                    "name": "string",
                    "crossLanguageDefinitionId": "TypeSpec.string",
                    "decorators": []
                  },
                  "contentTypes": ["text/event-stream"],
                  "streamKind": "sse",
                  "terminalEventType": "done",
                  "terminalEventValue": "[DONE]"
                }
                """;
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                Converters =
                {
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                },
            };

            var streamingType = JsonSerializer.Deserialize<InputType>(content, options) as InputStreamingType;

            Assert.IsNotNull(streamingType);
            Assert.AreEqual("Events", streamingType!.Name);
            Assert.AreEqual("Test.Events", streamingType.CrossLanguageDefinitionId);
            Assert.AreEqual(InputPrimitiveTypeKind.String, ((InputPrimitiveType)streamingType.ValueType).Kind);
            CollectionAssert.AreEqual(new[] { "text/event-stream" }, streamingType.ContentTypes);
            Assert.AreEqual("sse", streamingType.StreamKind);
            Assert.AreEqual("done", streamingType.TerminalEventType);
            Assert.AreEqual("[DONE]", streamingType.TerminalEventValue);
        }

        [Test]
        public void LoadsDynamicModel()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputModel = inputType as InputModelType;
            Assert.IsNotNull(inputModel);
            Assert.IsTrue(inputModel!.IsDynamicModel);
        }

        [Test]
        public void LoadsDynamicModelWithModelProperties()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            var friendModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "Friend");
            Assert.IsNotNull(friendModel);
            Assert.IsTrue(friendModel!.IsDynamicModel);

            var anotherModelProperty = friendModel.Properties.SingleOrDefault(p => p.Type is InputModelType);
            Assert.IsNotNull(anotherModelProperty);
            var anotherModel = (InputModelType)anotherModelProperty!.Type;
            Assert.IsTrue(anotherModel.IsDynamicModel);

            var nullableModelProperty = friendModel.Properties.SingleOrDefault(p => p.Type is InputNullableType);
            Assert.IsNotNull(nullableModelProperty);
            anotherModel = (nullableModelProperty!.Type as InputNullableType)!.Type as InputModelType;
            Assert.IsTrue(anotherModel!.IsDynamicModel);

            var unionModelProperty = friendModel.Properties.SingleOrDefault(p => p.Type is InputUnionType);
            Assert.IsNotNull(unionModelProperty);
            var variantTypes = (unionModelProperty!.Type as InputUnionType)!.VariantTypes;
            foreach (var variantType in variantTypes)
            {
                Assert.IsTrue(((InputModelType)variantType).IsDynamicModel);
            }

            var modelProperty = anotherModel.Properties.SingleOrDefault(p => p.Type is InputModelType);
            Assert.IsNotNull(modelProperty);
            Assert.IsTrue(((InputModelType)modelProperty!.Type).IsDynamicModel);

            var nullableModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "NullableModel");
            Assert.IsNotNull(nullableModel);

            var nullableUnionProperty = nullableModel!.Properties.SingleOrDefault(p => p.Type is InputNullableType n && p.Name.Equals("NullableUnionDynamicProperty"));
            Assert.IsNotNull(nullableUnionProperty);
            var nullableUnionType = nullableUnionProperty!.Type;
            bool isNullable = nullableUnionType is InputNullableType;
            Assert.IsTrue(isNullable);
            Assert.IsTrue((nullableUnionType as InputNullableType)!.Type is InputUnionType);
            var nullableUnionVariantTypes = ((nullableUnionType as InputNullableType)!.Type as InputUnionType)!.VariantTypes;
            foreach (var variantType in nullableUnionVariantTypes)
            {
                Assert.IsTrue(((InputModelType)variantType).IsDynamicModel);
            }
        }

        [Test]
        public void LoadsModelWithNoneUsageAndAddsJson()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputModel = inputType as InputModelType;
            Assert.IsNotNull(inputModel);

            Assert.IsTrue(inputModel!.Usage.HasFlag(InputModelTypeUsage.Json));
        }

        [Test]
        public void LoadsDynamicDerivedModelMarksBaseModelAsDynamic()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            // Find the base model (should not have @dynamicModel decorator)
            var baseModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "BaseModel");
            Assert.IsNotNull(baseModel);
            Assert.IsFalse(baseModel!.Decorators.Any(d => d.Name.Equals("TypeSpec.HttpClient.CSharp.@dynamicModel")));

            var derivedModel = inputNamespace.Models.SingleOrDefault(m => m.Name == "DerivedModel");
            Assert.IsNotNull(derivedModel);
            Assert.IsTrue(derivedModel!.Decorators.Any(d => d.Name.Equals("TypeSpec.HttpClient.CSharp.@dynamicModel")));
            Assert.IsTrue(derivedModel.IsDynamicModel);

            // Verify that the base model is not marked as dynamic
            Assert.IsFalse(baseModel.IsDynamicModel);
            Assert.AreEqual(baseModel, derivedModel.BaseModel);
        }

        [Test]
        public void LoadsDynamicDiscriminatedModelMarksBaseModelPropertiesAsDynamic()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            // Find the base model with model properties (discriminated model)
            var baseModelWithProperties = inputNamespace!.Models.SingleOrDefault(m => m.Name == "BaseModelWithProperties");
            Assert.IsNotNull(baseModelWithProperties);
            Assert.IsNotNull(baseModelWithProperties!.DiscriminatorProperty, "Base model should have a discriminator property");

            // Find the derived model (should have @dynamicModel decorator)
            var derivedModel = inputNamespace.Models.SingleOrDefault(m => m.Name == "DerivedModelExtendingBase");
            Assert.IsNotNull(derivedModel);
            Assert.IsTrue(derivedModel!.IsDynamicModel);

            // Verify that the discriminated base model is marked as dynamic because it has a dynamic derived model
            Assert.IsTrue(baseModelWithProperties!.IsDynamicModel);

            // Verify that model properties in the base model are also marked as dynamic
            var nestedModelProperty = baseModelWithProperties.Properties.SingleOrDefault(p => p.Name == "NestedModel");
            Assert.IsNotNull(nestedModelProperty);
            Assert.IsTrue(nestedModelProperty!.Type is InputModelType);
            var nestedModel = (InputModelType)nestedModelProperty.Type;
            Assert.IsTrue(nestedModel.IsDynamicModel);

            // Verify nested array of models
            var arrayProperty = baseModelWithProperties.Properties.SingleOrDefault(p => p.Name == "ArrayOfModels");
            Assert.IsNotNull(arrayProperty);
            Assert.IsTrue(arrayProperty!.Type is InputArrayType);
            var arrayType = (InputArrayType)arrayProperty.Type;
            Assert.IsTrue(arrayType.ValueType is InputModelType);
            var arrayValueModel = (InputModelType)arrayType.ValueType;
            Assert.IsTrue(arrayValueModel.IsDynamicModel);
        }

        [Test]
        public void LoadsDynamicDiscriminatedModelWithMultipleLevelsOfInheritance()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            // Find models at different levels
            var grandparentModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "GrandparentModel");
            var parentModel = inputNamespace.Models.SingleOrDefault(m => m.Name == "ParentModel");
            var childModel = inputNamespace.Models.SingleOrDefault(m => m.Name == "ChildModel");

            Assert.IsNotNull(grandparentModel);
            Assert.IsNotNull(parentModel);
            Assert.IsNotNull(childModel);

            // Verify inheritance chain
            Assert.AreEqual(grandparentModel, parentModel!.BaseModel);
            Assert.AreEqual(parentModel, childModel!.BaseModel);

            // Verify discriminator setup - grandparent is the discriminated base
            Assert.IsNotNull(grandparentModel!.DiscriminatorProperty, "Grandparent model should have a discriminator property");
            Assert.IsNotNull(parentModel.DiscriminatorValue, "Parent model should have a discriminator value");
            Assert.IsNotNull(childModel.DiscriminatorValue, "Child model should have a discriminator value");

            // Only the child has the @dynamicModel decorator
            Assert.IsTrue(childModel.Decorators.Any(d => d.Name.Equals("TypeSpec.HttpClient.CSharp.@dynamicModel")));
            Assert.IsFalse(parentModel.Decorators.Any(d => d.Name.Equals("TypeSpec.HttpClient.CSharp.@dynamicModel")));
            Assert.IsFalse(grandparentModel!.Decorators.Any(d => d.Name.Equals("TypeSpec.HttpClient.CSharp.@dynamicModel")));

            // Verify all models in the chain are marked as dynamic due to discriminated inheritance
            Assert.IsTrue(childModel.IsDynamicModel);
            Assert.IsTrue(parentModel.IsDynamicModel);
            Assert.IsTrue(grandparentModel.IsDynamicModel);
        }

        [Test]
        public void LoadsClientWithSubclientInitializedBy()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputNamespaceConverter(referenceHandler),
                    new InputClientConverter(referenceHandler),
                },
            };
            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(content, options);

            Assert.IsNotNull(inputNamespace);

            var parentClient = inputNamespace!.Clients.SingleOrDefault(c => c.Name == "ParentClient");
            Assert.IsNotNull(parentClient);
            Assert.AreEqual(InputClientInitializedBy.Individually, parentClient!.InitializedBy);
            Assert.IsNull(parentClient.Parent, "Parent client should not have a parent");
            Assert.AreEqual(1, parentClient.Children.Count, "Parent client should have 1 child");

            var subClient = inputNamespace.Clients.SingleOrDefault(c => c.Name == "SubClient");
            Assert.IsNotNull(subClient);
            Assert.AreEqual(InputClientInitializedBy.Individually | InputClientInitializedBy.Parent, subClient!.InitializedBy);
            Assert.IsNotNull(subClient.Parent, "SubClient should have a parent");
            Assert.AreEqual("ParentClient", subClient.Parent!.Name, "SubClient's parent should be ParentClient");
            Assert.AreEqual(0, subClient.Children.Count, "SubClient should have no children");
        }

        [Test]
        public void DeserializeUnionWithExternalMetadata()
        {
            var json = @"{
                ""$id"": ""1"",
                ""kind"": ""union"",
                ""name"": ""TestUnion"",
                ""variantTypes"": [
                    { ""$id"": ""2"", ""kind"": ""string"", ""name"": ""string"", ""crossLanguageDefinitionId"": ""TypeSpec.string"" }
                ],
                ""external"": {
                    ""identity"": ""Azure.Core.Expressions.DataFactoryElement"",
                    ""package"": ""Azure.Core.Expressions"",
                    ""minVersion"": ""1.0.0""
                }
            }";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new InputTypeConverter(referenceHandler),
                    new InputUnionTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputExternalTypeMetadataConverter()
                }
            };

            var union = JsonSerializer.Deserialize<InputUnionType>(json, options);
            Assert.IsNotNull(union);
            Assert.IsNotNull(union!.External);
            Assert.AreEqual("Azure.Core.Expressions.DataFactoryElement", union.External!.Identity);
            Assert.AreEqual("Azure.Core.Expressions", union.External.Package);
            Assert.AreEqual("1.0.0", union.External.MinVersion);
            Assert.AreEqual(1, union.VariantTypes.Count);
        }

        [Test]
        public void DeserializeModelWithExternalMetadata()
        {
            var json = @"{
                ""$id"": ""1"",
                ""kind"": ""model"",
                ""name"": ""TestModel"",
                ""namespace"": ""Test.Models"",
                ""crossLanguageDefinitionId"": ""Test.Models.TestModel"",
                ""usage"": ""None"",
                ""properties"": [],
                ""external"": {
                    ""identity"": ""System.Text.Json.JsonElement"",
                    ""package"": ""System.Text.Json"",
                    ""minVersion"": ""8.0.0""
                }
            }";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new InputTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new InputExternalTypeMetadataConverter()
                }
            };

            var model = JsonSerializer.Deserialize<InputModelType>(json, options);
            Assert.IsNotNull(model);
            Assert.IsNotNull(model!.External);
            Assert.AreEqual("System.Text.Json.JsonElement", model.External!.Identity);
            Assert.AreEqual("System.Text.Json", model.External.Package);
            Assert.AreEqual("8.0.0", model.External.MinVersion);
        }

        [Test]
        public void DeserializeModelWithExternalUsagePreservesInputAndOutput()
        {
            // TCGC emits the External usage flag (UsageFlags.External) for models that are also
            // referenced by external types. The C# InputModelTypeUsage enum must recognize it so
            // that Enum.TryParse does not fail on the unknown token and collapse the whole usage to
            // None, which would strip Input/Output and make every property get-only.
            var json = @"{
                ""$id"": ""1"",
                ""kind"": ""model"",
                ""name"": ""TestModel"",
                ""namespace"": ""Test.Models"",
                ""crossLanguageDefinitionId"": ""Test.Models.TestModel"",
                ""usage"": ""Input,Output,External"",
                ""properties"": []
            }";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new InputTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new InputExternalTypeMetadataConverter()
                }
            };

            var model = JsonSerializer.Deserialize<InputModelType>(json, options);
            Assert.IsNotNull(model);
            Assert.IsTrue(model!.Usage.HasFlag(InputModelTypeUsage.Input), "Model should retain Input usage flag");
            Assert.IsTrue(model.Usage.HasFlag(InputModelTypeUsage.Output), "Model should retain Output usage flag");
            Assert.IsTrue(model.Usage.HasFlag(InputModelTypeUsage.External), "Model should have External usage flag");
        }

        [Test]
        public void DeserializeArrayWithExternalMetadata()
        {
            var json = @"{
                ""$id"": ""1"",
                ""kind"": ""array"",
                ""name"": ""TestArray"",
                ""crossLanguageDefinitionId"": ""TestArray"",
                ""valueType"": { ""$id"": ""2"", ""kind"": ""string"", ""name"": ""string"", ""crossLanguageDefinitionId"": ""TypeSpec.string"" },
                ""external"": {
                    ""identity"": ""System.Collections.Generic.IList""
                }
            }";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new InputTypeConverter(referenceHandler),
                    new InputArrayTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputExternalTypeMetadataConverter()
                }
            };

            var array = JsonSerializer.Deserialize<InputArrayType>(json, options);
            Assert.IsNotNull(array);
            Assert.IsNotNull(array!.External);
            Assert.AreEqual("System.Collections.Generic.IList", array.External!.Identity);
            Assert.IsNull(array.External.Package);
            Assert.IsNull(array.External.MinVersion);
        }

        [Test]
        public void DeserializeDictionaryWithExternalMetadata()
        {
            var json = @"{
                ""$id"": ""1"",
                ""kind"": ""dict"",
                ""keyType"": { ""$id"": ""2"", ""kind"": ""string"", ""name"": ""string"", ""crossLanguageDefinitionId"": ""TypeSpec.string"" },
                ""valueType"": { ""$id"": ""3"", ""kind"": ""string"", ""name"": ""string"", ""crossLanguageDefinitionId"": ""TypeSpec.string"" },
                ""external"": {
                    ""identity"": ""System.Collections.Generic.IDictionary"",
                    ""package"": ""System.Collections""
                }
            }";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new InputTypeConverter(referenceHandler),
                    new InputDictionaryTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputExternalTypeMetadataConverter()
                }
            };

            var dictionary = JsonSerializer.Deserialize<InputDictionaryType>(json, options);
            Assert.IsNotNull(dictionary);
            Assert.IsNotNull(dictionary!.External);
            Assert.AreEqual("System.Collections.Generic.IDictionary", dictionary.External!.Identity);
            Assert.AreEqual("System.Collections", dictionary.External.Package);
            Assert.IsNull(dictionary.External.MinVersion);
        }

        [Test]
        public void DeserializeEnumWithExternalMetadata()
        {
            var json = @"{
                ""$id"": ""1"",
                ""kind"": ""enum"",
                ""name"": ""TestEnum"",
                ""namespace"": ""Test.Models"",
                ""crossLanguageDefinitionId"": ""Test.Models.TestEnum"",
                ""valueType"": { ""$id"": ""2"", ""kind"": ""string"", ""name"": ""string"", ""crossLanguageDefinitionId"": ""TypeSpec.string"" },
                ""values"": [],
                ""isFixed"": true,
                ""external"": {
                    ""identity"": ""System.DayOfWeek""
                }
            }";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new InputTypeConverter(referenceHandler),
                    new InputEnumTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputExternalTypeMetadataConverter()
                }
            };

            var enumType = JsonSerializer.Deserialize<InputEnumType>(json, options);
            Assert.IsNotNull(enumType);
            Assert.IsNotNull(enumType!.External);
            Assert.AreEqual("System.DayOfWeek", enumType.External!.Identity);
            Assert.IsNull(enumType.External.Package);
            Assert.IsNull(enumType.External.MinVersion);
        }

        [Test]
        public void LoadsModelWithExternalMetadataEndToEnd()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var inputNamespace = TypeSpecSerialization.Deserialize(content);

            Assert.IsNotNull(inputNamespace);

            var externalModel = inputNamespace!.Models.SingleOrDefault(m => m.Name == "ExternalModel");
            Assert.IsNotNull(externalModel);
            Assert.IsNotNull(externalModel!.External, "External metadata should be populated");
            Assert.AreEqual("System.Text.Json.JsonElement", externalModel.External!.Identity);
            Assert.AreEqual("System.Text.Json", externalModel.External.Package);
            Assert.AreEqual("8.0.0", externalModel.External.MinVersion);
        }

        [Test]
        public void LoadsEnumsWithIntegerAndLongValues()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var inputNamespace = TypeSpecSerialization.Deserialize(content);

            Assert.IsNotNull(inputNamespace);
            Assert.AreEqual(3, inputNamespace!.Enums.Count);

            // 1) Base `integer` kind
            var integerEnum = inputNamespace.Enums.SingleOrDefault(e => e.Name == "WeatherIconCode");
            Assert.IsNotNull(integerEnum);
            Assert.AreEqual(InputPrimitiveTypeKind.Integer, integerEnum!.ValueType.Kind);
            Assert.AreEqual(2, integerEnum.Values.Count);
            var sunny = integerEnum.Values[0] as InputEnumTypeIntegerValue;
            Assert.IsNotNull(sunny);
            Assert.AreEqual("Sunny", sunny!.Name);
            Assert.AreEqual(1L, sunny.IntegerValue);
            var mostlySunny = integerEnum.Values[1] as InputEnumTypeIntegerValue;
            Assert.IsNotNull(mostlySunny);
            Assert.AreEqual(2L, mostlySunny!.IntegerValue);

            // 2) Explicit int32 kind, including a negative value.
            var int32Enum = inputNamespace.Enums.SingleOrDefault(e => e.Name == "Int32WeatherCode");
            Assert.IsNotNull(int32Enum);
            Assert.AreEqual(InputPrimitiveTypeKind.Int32, int32Enum!.ValueType.Kind);
            var cold = int32Enum.Values[0] as InputEnumTypeIntegerValue;
            Assert.IsNotNull(cold);
            Assert.AreEqual(-10L, cold!.IntegerValue);
            var hot = int32Enum.Values[1] as InputEnumTypeIntegerValue;
            Assert.IsNotNull(hot);
            Assert.AreEqual(100L, hot!.IntegerValue);

            // 3) int64 (long) kind, including long.MaxValue to confirm we use GetInt64.
            var longEnum = inputNamespace.Enums.SingleOrDefault(e => e.Name == "LongWeatherTimestamp");
            Assert.IsNotNull(longEnum);
            Assert.AreEqual(InputPrimitiveTypeKind.Int64, longEnum!.ValueType.Kind);
            var epoch = longEnum.Values[0] as InputEnumTypeIntegerValue;
            Assert.IsNotNull(epoch);
            Assert.AreEqual(0L, epoch!.IntegerValue);
            var maxValue = longEnum.Values[1] as InputEnumTypeIntegerValue;
            Assert.IsNotNull(maxValue);
            Assert.AreEqual(long.MaxValue, maxValue!.IntegerValue);
        }

        [Test]
        public void LoadsXmlOnlyModelDoesNotAddJsonUsage()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputSerializationOptionsConverter(),
                    new InputJsonSerializationOptionsConverter(),
                    new InputXmlSerializationOptionsConverter(),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputModel = inputType as InputModelType;
            Assert.IsNotNull(inputModel);

            Assert.IsTrue(inputModel!.Usage.HasFlag(InputModelTypeUsage.Xml), "Model should have Xml usage flag");
            Assert.IsFalse(inputModel.Usage.HasFlag(InputModelTypeUsage.Json), "XML-only model should NOT have Json usage flag added");
            Assert.IsTrue(inputModel.Usage.HasFlag(InputModelTypeUsage.Input), "Model should retain Input usage flag");
        }

        [Test]
        public void LoadsMultipartOnlyModelDoesNotAddJsonUsage()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputSerializationOptionsConverter(),
                    new InputJsonSerializationOptionsConverter(),
                    new InputXmlSerializationOptionsConverter(),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputModel = inputType as InputModelType;
            Assert.IsNotNull(inputModel);

            Assert.IsTrue(inputModel!.Usage.HasFlag(InputModelTypeUsage.MultipartFormData), "Model should have MultipartFormData usage flag");
            Assert.IsFalse(inputModel.Usage.HasFlag(InputModelTypeUsage.Json), "Multipart-only model should NOT have Json usage flag added");
            Assert.IsTrue(inputModel.Usage.HasFlag(InputModelTypeUsage.Input), "Model should retain Input usage flag");
        }

        [Test]
        public void LoadsNonXmlModelAddsJsonUsage()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputSerializationOptionsConverter(),
                    new InputJsonSerializationOptionsConverter(),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputModel = inputType as InputModelType;
            Assert.IsNotNull(inputModel);

            Assert.IsTrue(inputModel!.Usage.HasFlag(InputModelTypeUsage.Json), "Non-XML model should have Json usage flag added");
            Assert.IsFalse(inputModel.Usage.HasFlag(InputModelTypeUsage.Xml), "Model should NOT have Xml usage flag");
            Assert.IsTrue(inputModel.Usage.HasFlag(InputModelTypeUsage.Input), "Model should retain Input usage flag");
        }

        [Test]
        public void LoadsModelWithBothXmlAndJsonUsage()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputSerializationOptionsConverter(),
                    new InputJsonSerializationOptionsConverter(),
                    new InputXmlSerializationOptionsConverter(),
                },
            };
            var inputType = JsonSerializer.Deserialize<InputType>(content, options);

            Assert.IsNotNull(inputType);

            var inputModel = inputType as InputModelType;
            Assert.IsNotNull(inputModel);

            Assert.IsTrue(inputModel!.Usage.HasFlag(InputModelTypeUsage.Xml), "Model should have Xml usage flag");
            Assert.IsTrue(inputModel.Usage.HasFlag(InputModelTypeUsage.Json), "Model should have Json usage flag");
            Assert.IsTrue(inputModel.Usage.HasFlag(InputModelTypeUsage.Input), "Model should have Input usage flag");
            Assert.IsTrue(inputModel.Usage.HasFlag(InputModelTypeUsage.Output), "Model should have Output usage flag");
        }

        private static JsonSerializerOptions CreateSerializationOptionsTestOptions()
        {
            var referenceHandler = new TypeSpecReferenceHandler();
            return new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputSerializationOptionsConverter(),
                    new InputJsonSerializationOptionsConverter(),
                    new InputXmlSerializationOptionsConverter(),
                    new InputXmlNamespaceOptionsConverter(),
                    new InputBinarySerializationOptionsConverter(),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new InputModelPropertyConverter(referenceHandler),
                    new InputDecoratorInfoConverter(),
                    new InputConstantConverter(),
                    new InputBodyParameterConverter(referenceHandler),
                    new InputOperationResponseConverter(),
                    new InputOperationResponseHeaderConverter(),
                }
            };
        }

        [Test]
        public void ParsesEmptySerializationOptions()
        {
            const string json = "{}";

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNull(result!.Json);
            Assert.IsNull(result.Xml);
            Assert.IsNull(result.Multipart);
            Assert.IsNull(result.Binary);
        }

        [Test]
        public void ParsesJsonSerializationOptions()
        {
            const string json = """
                {
                  "json": { "name": "message" }
                }
                """;

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Json);
            Assert.AreEqual("message", result.Json!.Name);
            Assert.IsNull(result.Xml);
            Assert.IsNull(result.Binary);
        }

        [Test]
        public void ParsesXmlSerializationOptions()
        {
            const string json = """
                {
                  "xml": { "name": "Book", "attribute": false }
                }
                """;

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Xml);
            Assert.AreEqual("Book", result.Xml!.Name);
            Assert.AreEqual(false, result.Xml.Attribute);
        }

        [Test]
        public void ParsesBinarySerializationOptions()
        {
            const string json = """
                {
                  "binary": {
                    "isFile": true,
                    "isText": false,
                    "contentTypes": [ "application/octet-stream" ],
                    "filename": {
                      "$id": "1",
                      "kind": "property",
                      "name": "filename",
                      "serializedName": "filename",
                      "type": { "$id": "2", "kind": "string", "name": "string", "crossLanguageDefinitionId": "TypeSpec.string" },
                      "optional": true,
                      "readOnly": false,
                      "discriminator": false,
                      "flatten": false,
                      "crossLanguageDefinitionId": "TypeSpec.Http.File.filename"
                    }
                  }
                }
                """;

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Binary);
            Assert.IsTrue(result.Binary!.IsFile);
            Assert.AreEqual(false, result.Binary.IsText);
            Assert.IsNotNull(result.Binary.ContentTypes);
            Assert.AreEqual(1, result.Binary.ContentTypes!.Count);
            Assert.AreEqual("application/octet-stream", result.Binary.ContentTypes[0]);
            Assert.IsNotNull(result.Binary.Filename);
            Assert.AreEqual("filename", result.Binary.Filename!.Name);
        }

        [Test]
        public void ParsesBinarySerializationOptionsWithDefaults()
        {
            const string json = """
                {
                  "binary": { "isFile": false }
                }
                """;

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Binary);
            Assert.IsFalse(result.Binary!.IsFile);
            Assert.IsNull(result.Binary.IsText);
            Assert.IsNull(result.Binary.ContentTypes);
            Assert.IsNull(result.Binary.Filename);
        }

        [Test]
        public void InputBodyParameterParsesSerializationOptions()
        {
            const string json = """
                {
                  "$id": "1",
                  "name": "body",
                  "kind": "body",
                  "type": { "$id": "2", "kind": "string", "name": "string", "crossLanguageDefinitionId": "TypeSpec.string" },
                  "optional": false,
                  "readOnly": false,
                  "serializedName": "body",
                  "isApiVersion": false,
                  "scope": "method",
                  "contentTypes": [ "application/json" ],
                  "defaultContentType": "application/json",
                  "serializationOptions": {
                    "json": { "name": "body" }
                  }
                }
                """;

            var result = JsonSerializer.Deserialize<InputBodyParameter>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.SerializationOptions);
            Assert.IsNotNull(result.SerializationOptions!.Json);
            Assert.AreEqual("body", result.SerializationOptions.Json!.Name);
        }

        [Test]
        public void InputBodyParameterParsesBinarySerializationOptions()
        {
            const string json = """
                {
                  "$id": "1",
                  "name": "data",
                  "kind": "body",
                  "type": { "$id": "2", "kind": "bytes", "name": "bytes", "crossLanguageDefinitionId": "TypeSpec.bytes" },
                  "optional": false,
                  "readOnly": false,
                  "serializedName": "data",
                  "isApiVersion": false,
                  "scope": "method",
                  "contentTypes": [ "application/octet-stream" ],
                  "defaultContentType": "application/octet-stream",
                  "serializationOptions": {
                    "binary": {
                      "isFile": true,
                      "isText": false,
                      "contentTypes": [ "application/octet-stream" ],
                      "filename": {
                        "$id": "3",
                        "kind": "property",
                        "name": "filename",
                        "serializedName": "filename",
                        "type": { "$id": "4", "kind": "string", "name": "string", "crossLanguageDefinitionId": "TypeSpec.string" },
                        "optional": true,
                        "readOnly": false,
                        "discriminator": false,
                        "flatten": false,
                        "crossLanguageDefinitionId": "TypeSpec.Http.File.filename"
                      }
                    }
                  }
                }
                """;

            var result = JsonSerializer.Deserialize<InputBodyParameter>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.SerializationOptions);
            Assert.IsNotNull(result.SerializationOptions!.Binary);
            Assert.IsTrue(result.SerializationOptions.Binary!.IsFile);
            Assert.AreEqual(false, result.SerializationOptions.Binary.IsText);
            Assert.IsNotNull(result.SerializationOptions.Binary.ContentTypes);
            Assert.AreEqual(1, result.SerializationOptions.Binary.ContentTypes!.Count);
            Assert.AreEqual("application/octet-stream", result.SerializationOptions.Binary.ContentTypes[0]);
            Assert.IsNotNull(result.SerializationOptions.Binary.Filename);
            Assert.AreEqual("filename", result.SerializationOptions.Binary.Filename!.Name);
        }

        [Test]
        public void InputBodyParameterDefaultsSerializationOptionsToNull()
        {
            const string json = """
                {
                  "$id": "1",
                  "name": "body",
                  "kind": "body",
                  "type": { "$id": "2", "kind": "string", "name": "string", "crossLanguageDefinitionId": "TypeSpec.string" },
                  "optional": false,
                  "readOnly": false,
                  "serializedName": "body",
                  "isApiVersion": false,
                  "scope": "method",
                  "contentTypes": [ "application/json" ],
                  "defaultContentType": "application/json"
                }
                """;

            var result = JsonSerializer.Deserialize<InputBodyParameter>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNull(result!.SerializationOptions);
        }

        [Test]
        public void InputOperationResponseParsesSerializationOptions()
        {
            const string json = """
                {
                  "statusCodes": [ 200 ],
                  "headers": [],
                  "isErrorResponse": false,
                  "contentTypes": [ "application/xml" ],
                  "serializationOptions": {
                    "xml": { "name": "Book" }
                  }
                }
                """;

            var result = JsonSerializer.Deserialize<InputOperationResponse>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.SerializationOptions);
            Assert.IsNotNull(result.SerializationOptions!.Xml);
            Assert.AreEqual("Book", result.SerializationOptions.Xml!.Name);
        }

        [Test]
        public void InputOperationResponseParsesBinarySerializationOptions()
        {
            const string json = """
                {
                  "statusCodes": [ 200 ],
                  "headers": [],
                  "isErrorResponse": false,
                  "contentTypes": [ "application/octet-stream" ],
                  "serializationOptions": {
                    "binary": {
                      "isFile": true,
                      "isText": false,
                      "contentTypes": [ "application/octet-stream" ],
                      "filename": {
                        "$id": "1",
                        "kind": "property",
                        "name": "filename",
                        "serializedName": "filename",
                        "type": { "$id": "2", "kind": "string", "name": "string", "crossLanguageDefinitionId": "TypeSpec.string" },
                        "optional": true,
                        "readOnly": false,
                        "discriminator": false,
                        "flatten": false,
                        "crossLanguageDefinitionId": "TypeSpec.Http.File.filename"
                      }
                    }
                  }
                }
                """;

            var result = JsonSerializer.Deserialize<InputOperationResponse>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.SerializationOptions);
            Assert.IsNotNull(result.SerializationOptions!.Binary);
            Assert.IsTrue(result.SerializationOptions.Binary!.IsFile);
            Assert.AreEqual(false, result.SerializationOptions.Binary.IsText);
            Assert.IsNotNull(result.SerializationOptions.Binary.ContentTypes);
            Assert.AreEqual(1, result.SerializationOptions.Binary.ContentTypes!.Count);
            Assert.AreEqual("application/octet-stream", result.SerializationOptions.Binary.ContentTypes[0]);
            Assert.IsNotNull(result.SerializationOptions.Binary.Filename);
            Assert.AreEqual("filename", result.SerializationOptions.Binary.Filename!.Name);
        }

        [Test]
        public void InputOperationResponseDefaultsSerializationOptionsToNull()
        {
            const string json = """
                {
                  "statusCodes": [ 204 ],
                  "headers": [],
                  "isErrorResponse": false,
                  "contentTypes": []
                }
                """;

            var result = JsonSerializer.Deserialize<InputOperationResponse>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNull(result!.SerializationOptions);
        }

        [Test]
        public void IgnoresUnknownPropertiesInSerializationOptions()
        {
            const string json = """
                {
                  "json": { "name": "msg" },
                  "unknown": "ignored"
                }
                """;

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateSerializationOptionsTestOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Json);
            Assert.AreEqual("msg", result.Json!.Name);
        }

        private static JsonSerializerOptions CreateEnumValueTestOptions()
        {
            var referenceHandler = new TypeSpecReferenceHandler();
            return new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputEnumTypeConverter(referenceHandler),
                    new InputEnumTypeValueConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                }
            };
        }

        private static string CreateEnumJson(string valueKindJson, string rawValueJson)
        {
            return $$"""
                {
                  "$id": "1",
                  "kind": "enum",
                  "name": "TestEnum",
                  "namespace": "Test.Models",
                  "crossLanguageDefinitionId": "Test.Models.TestEnum",
                  "apiVersions": ["2024-01-01", "2024-06-01-preview"],
                  "valueType": { "$id": "2", "kind": {{valueKindJson}}, "name": "valueType", "crossLanguageDefinitionId": "TypeSpec.numeric" },
                  "values": [
                    {
                      "$id": "3",
                      "kind": "enumvalue",
                      "name": "One",
                      "value": {{rawValueJson}},
                      "valueType": { "$ref": "2" },
                      "enumType": { "$ref": "1" }
                    }
                  ],
                  "isFixed": true
                }
                """;
        }

        [TestCase("\"integer\"", "1", 1L)]
        [TestCase("\"int8\"", "1", 1L)]
        [TestCase("\"int16\"", "1", 1L)]
        [TestCase("\"int32\"", "1", 1L)]
        [TestCase("\"uint8\"", "1", 1L)]
        [TestCase("\"uint16\"", "1", 1L)]
        [TestCase("\"int64\"", "9223372036854775807", 9223372036854775807L)]
        [TestCase("\"uint32\"", "4294967295", 4294967295L)]
        [TestCase("\"uint64\"", "9223372036854775807", 9223372036854775807L)]
        [TestCase("\"safeInt\"", "9007199254740991", 9007199254740991L)]
        public void DeserializeEnumWithIntegerKind(string valueKindJson, string rawValueJson, long expected)
        {
            var json = CreateEnumJson(valueKindJson, rawValueJson);
            var enumType = JsonSerializer.Deserialize<InputEnumType>(json, CreateEnumValueTestOptions());

            Assert.IsNotNull(enumType);
            Assert.AreEqual(1, enumType!.Values.Count);
            var value = enumType.Values[0] as InputEnumTypeIntegerValue;
            Assert.IsNotNull(value);
            Assert.AreEqual(expected, value!.IntegerValue);
            Assert.AreEqual("One", value.Name);
        }

        [TestCase("\"float\"", "1.5", 1.5f)]
        [TestCase("\"float32\"", "1.5", 1.5f)]
        [TestCase("\"float64\"", "1.5", 1.5f)]
        [TestCase("\"numeric\"", "1.5", 1.5f)]
        [TestCase("\"decimal\"", "1.5", 1.5f)]
        [TestCase("\"decimal128\"", "1.5", 1.5f)]
        public void DeserializeEnumWithFloatKind(string valueKindJson, string rawValueJson, float expected)
        {
            var json = CreateEnumJson(valueKindJson, rawValueJson);
            var enumType = JsonSerializer.Deserialize<InputEnumType>(json, CreateEnumValueTestOptions());

            Assert.IsNotNull(enumType);
            Assert.AreEqual(1, enumType!.Values.Count);
            var value = enumType.Values[0] as InputEnumTypeFloatValue;
            Assert.IsNotNull(value);
            Assert.AreEqual(expected, value!.FloatValue);
            Assert.AreEqual("One", value.Name);
        }

        [Test]
        public void DeserializeEnumWithStringKind()
        {
            var json = CreateEnumJson("\"string\"", "\"sunny\"");
            var enumType = JsonSerializer.Deserialize<InputEnumType>(json, CreateEnumValueTestOptions());

            Assert.IsNotNull(enumType);
            Assert.AreEqual(1, enumType!.Values.Count);
            CollectionAssert.AreEqual(new[] { "2024-01-01", "2024-06-01-preview" }, enumType.ApiVersions);
            var value = enumType.Values[0] as InputEnumTypeStringValue;
            Assert.IsNotNull(value);
            Assert.AreEqual("sunny", value!.StringValue);
        }

        [Test]
        public void DeserializeEnumWithUnsupportedKindThrows()
        {
            var json = CreateEnumJson("\"boolean\"", "true");
            Assert.Throws<JsonException>(() =>
                JsonSerializer.Deserialize<InputEnumType>(json, CreateEnumValueTestOptions()));
        }
    }
}
