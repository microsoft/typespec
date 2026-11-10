using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class TypeSpecInputExampleConverterTests
    {
        [Test]
        public void OpaqueExamplesPreserveReferenceProperties(
            [Values("unknown", "union")] string kind,
            [Values("https://example.com/person.schema.json", "1")] string id,
            [Values] bool isArray,
            [Values("array", "model", "dict")] string containerKind)
        {
            const string prefix = "$";
            var payload = $$"""
                {
                  "type": "object",
                  "{{prefix}}id": "{{id}}",
                  "{{prefix}}schema": "https://json-schema.org/draft/2020-12/schema",
                  "{{prefix}}ref": "missing",
                  "$$id": "literal-double-dollar",
                  "$$$id": "literal-triple-dollar",
                  "{{prefix}}values": [
                    { "{{prefix}}id": "{{id}}", "kind": "model", "name": "NotAReference" },
                    { "{{prefix}}ref": "1" },
                    { "{{prefix}}id": 42, "{{prefix}}values": null }
                  ],
                  "properties": { "age": { "type": "integer" } }
                }
                """;
            var exampleValue = $$"""
                {
                  "kind": "{{kind}}",
                  "type": { "kind": "unknown" },
                  "value": {{(isArray ? $"[{payload}]" : payload)}}
                }
                """;
            var container = $$"""
                {
                  "kind": "array",
                  "type": { "kind": "array", "name": "Array", "valueType": { "kind": "unknown" } },
                  "value": [{{exampleValue}}, {{exampleValue}}, {{exampleValue}}, {{exampleValue}}, {{exampleValue}}, {{exampleValue}}]
                }
                """;
            if (containerKind != "array")
            {
                var type = containerKind == "model"
                    ? """{ "$id": "container", "kind": "model", "name": "Container", "properties": [] }"""
                    : """{ "kind": "dict", "keyType": { "kind": "string" }, "valueType": { "kind": "unknown" } }""";
                container = $$"""
                    {
                      "kind": "{{containerKind}}",
                      "type": {{type}},
                      "value": { "unknown": {{container}} }
                    }
                    """;
            }
            var result = DeserializeExampleValue(container);
            var value = (InputExampleListValue)(containerKind == "array" ? result : ((InputExampleObjectValue)result).Values["unknown"]);

            Assert.AreEqual(6, value.Values.Count);
            foreach (var item in value.Values)
            {
                var actual = ExtractObjectValues((InputExampleObjectValue)(isArray ? ((InputExampleListValue)item).Values[0] : item));
                var expected = new Dictionary<string, object>
                {
                    { "type", "object" },
                    { "$id", id },
                    { "$schema", "https://json-schema.org/draft/2020-12/schema" },
                    { "$ref", "missing" },
                    { "$$id", "literal-double-dollar" },
                    { "$$$id", "literal-triple-dollar" },
                    { "$values[0].$id", id },
                    { "$values[0].kind", "model" },
                    { "$values[0].name", "NotAReference" },
                    { "$values[1].$ref", "1" },
                    { "$values[2].$id", 42 },
                    { "$values[2].$values", null! },
                    { "properties.age.type", "integer" }
                };
                Assert.AreEqual(expected, actual);
            }
        }

        [Test]
        public void ObjectExamplesPreserveReferencePropertyNames([Values("model", "dict")] string kind)
        {
            const string prefix = "$";
            var type = kind == "model"
                ? """{ "$id": "payload-type", "kind": "model", "name": "Payload", "properties": [] }"""
                : """{ "kind": "dict", "keyType": { "kind": "string" }, "valueType": { "kind": "string" } }""";
            var value = (InputExampleObjectValue)DeserializeExampleValue($$"""
                {
                  "kind": "{{kind}}",
                  "type": {{type}},
                  "value": {
                    "{{prefix}}id": { "kind": "string", "type": { "$id": "string", "kind": "string" }, "value": "payload-id" },
                    "{{prefix}}ref": { "kind": "string", "type": { "$ref": "string" }, "value": "payload-ref" },
                    "{{prefix}}values": { "kind": "string", "type": { "$ref": "string" }, "value": "payload-values" },
                    "$$id": { "kind": "string", "type": { "$ref": "string" }, "value": "literal-double-dollar" },
                    "$$$id": { "kind": "string", "type": { "$ref": "string" }, "value": "literal-triple-dollar" }
                  }
                }
                """);

            Assert.AreEqual(new Dictionary<string, object>
            {
                { "$id", "payload-id" },
                { "$ref", "payload-ref" },
                { "$values", "payload-values" },
                { "$$id", "literal-double-dollar" },
                { "$$$id", "literal-triple-dollar" }
            }, ExtractObjectValues(value));
            Assert.AreSame(value.Values["$id"].Type, value.Values["$ref"].Type);
        }

        [TestCase("unknown")]
        [TestCase("union")]
        public void OpaqueExampleCannotDefineModelReference(string kind)
        {
            var content = $$"""
                {
                  "kind": "{{kind}}",
                  "type": {
                    "kind": "array", "name": "Array", "valueType": { "$ref": "payload" }
                  },
                  "value": { "$id": "payload", "kind": "model", "name": "NotAReference" }
                }
                """;

            var exception = Assert.Throws<JsonException>(() => DeserializeExampleValue(content));

            Assert.That(exception!.Message, Does.Contain("cannot resolve reference payload"));
        }

        [TestCase("unknown")]
        [TestCase("union")]
        public void OpaqueExamplesPreserveDeepPayloads(string kind)
        {
            var payload = new string('[', 70) + """{ "$$id": "literal" }""" + new string(']', 70);
            var value = DeserializeExampleValue($$"""
                {
                  "kind": "{{kind}}",
                  "type": { "kind": "unknown" },
                  "value": {{payload}}
                }
                """);

            for (var i = 0; i < 70; i++)
            {
                value = ((InputExampleListValue)value).Values[0];
            }
            Assert.AreEqual("literal", ((InputExampleRawValue)((InputExampleObjectValue)value).Values["$$id"]).RawValue);
        }

        [Test]
        public void OpaqueExamplesInReferencedDefinitions(
            [Values("client", "child", "method", "operation")] string target,
            [Values] bool definitionsFirst,
            [Values] bool shadowsDefinition)
        {
            var payloadId = "1";
            var value = (InputExampleObjectValue)DeserializeExampleValue("""
                {
                  "kind": "unknown",
                  "type": { "kind": "unknown" },
                  "value": { "$id": "1", "nested": { "$id": "1" } }
                }
                """, root =>
            {
                var client = root["clients"]![0]!;
                var child = client["children"]![0]!;
                var method = child["methods"]![0]!;
                var definition = target switch
                {
                    "client" => client,
                    "child" => child,
                    "method" => method,
                    _ => method["operation"]!
                };
                if (shadowsDefinition)
                {
                    payloadId = definition["$id"]!.GetValue<string>();
                    var payload = method["operation"]!["examples"]![0]!["parameters"]![0]!["value"]!["value"]!;
                    payload["$id"] = payloadId;
                    payload["nested"]!["$id"] = payloadId;
                }
                var reference = new JsonObject { ["$ref"] = definition["$id"]!.GetValue<string>() };
                var copy = definition.DeepClone();
                definition.ReplaceWith(reference);
                var extension = new JsonObject
                {
                    ["kind"] = "union",
                    ["type"] = new JsonObject(),
                    ["value"] = copy
                };
                if (definitionsFirst)
                {
                    root.AsObject().Insert(0, "extension", extension);
                }
                else
                {
                    root["extension"] = extension;
                }
            });

            Assert.AreEqual(payloadId, ((InputExampleRawValue)value.Values["$id"]).RawValue);
            Assert.AreEqual(payloadId, ((InputExampleRawValue)((InputExampleObjectValue)value.Values["nested"]).Values["$id"]).RawValue);
        }

        [Test]
        public void PreservesManyIdenticalOpaqueExamples()
        {
            var examples = new JsonArray();
            for (var i = 0; i < 2000; i++)
            {
                examples.Add(JsonNode.Parse("""
                    {
                      "kind": "unknown",
                      "type": { "kind": "unknown" },
                      "value": { "$id": "1" }
                    }
                    """));
            }
            var value = (InputExampleListValue)DeserializeExampleValue($$"""
                {
                  "kind": "array",
                  "type": { "kind": "array", "name": "Array", "valueType": { "kind": "unknown" } },
                  "value": {{examples.ToJsonString()}}
                }
                """);

            Assert.AreEqual(2000, value.Values.Count);
            foreach (var item in value.Values)
            {
                Assert.AreEqual("1", ((InputExampleRawValue)((InputExampleObjectValue)item).Values["$id"]).RawValue);
            }
        }

        [Test]
        public void PayloadReferencesCannotMakeDecoratorDataOpaque()
        {
            var value = DeserializeExampleValue("""
                { "kind": "unknown", "type": { "kind": "unknown" }, "value": {} }
                """, root =>
            {
                var client = root["clients"]![0]!;
                var id = client["$id"]!.GetValue<string>();
                var payload = client["children"]![0]!["methods"]![0]!["operation"]!["examples"]![0]!["parameters"]![0]!["value"]!["value"]!;
                payload["$id"] = id;
                payload["methods"] = JsonNode.Parse("""[{ "$ref": "decorator-method" }]""");
                client["decorators"] = JsonNode.Parse("""
                    [{
                      "name": "example",
                      "arguments": {
                        "method": {
                          "$id": "decorator-method", "kind": "basic",
                          "operation": {
                            "examples": [{
                              "parameters": [{
                                "value": {
                                  "kind": "unknown", "type": {},
                                  "value": { "$id": "model", "kind": "model", "name": "SharedModel" }
                                }
                              }]
                            }]
                          }
                        }
                      }
                    }]
                    """);
                root["extension"] = client.DeepClone();
                client.ReplaceWith(new JsonObject { ["$ref"] = id });
                root["models"]!.AsArray().Add(new JsonObject { ["$ref"] = "model" });
            });

            var methods = (InputExampleListValue)((InputExampleObjectValue)value).Values["methods"];
            Assert.AreEqual("decorator-method", ((InputExampleRawValue)((InputExampleObjectValue)methods.Values[0]).Values["$ref"]).RawValue);
        }

        [Test]
        public void PagingExamplesPreserveOpaquePayloads([Values("basic", "paging", "lropaging")] string methodKind)
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false, method: nameof(LoadOperationExamples));
            var root = JsonNode.Parse(File.ReadAllText(Path.Combine(directory, "tspCodeModel.json")))!;
            var method = root["clients"]![0]!["children"]![0]!["methods"]![0]!;
            var operation = method["operation"]!;
            var examples = operation["examples"]!.DeepClone();
            operation["examples"] = new JsonArray();
            examples[0]!["parameters"]![0]!["value"] = JsonNode.Parse("""
                {
                  "kind": "unknown",
                  "type": { "kind": "unknown" },
                  "value": { "$id": "payload-model", "kind": "model", "name": "PayloadModel" }
                }
                """);
            method["kind"] = methodKind;
            method["pagingMetadata"] = new JsonObject
            {
                ["nextLink"] = new JsonObject
                {
                    ["responseSegments"] = new JsonArray("nextLink"),
                    ["responseLocation"] = "body",
                    ["operation"] = new JsonObject
                    {
                        ["$id"] = "next-operation",
                        ["name"] = "Next",
                        ["httpMethod"] = "GET",
                        ["uri"] = "https://example.com",
                        ["path"] = "/",
                        ["crossLanguageDefinitionId"] = "Test.Next",
                        ["examples"] = examples
                    }
                }
            };
            method["lroMetadata"] = new JsonObject();
            root["models"]!.AsArray().Add(new JsonObject { ["$ref"] = "payload-model" });

            if (methodKind == "basic")
            {
                var input = TypeSpecSerialization.Deserialize(root.ToJsonString())!;
                Assert.AreEqual("PayloadModel", input.Models[^1].Name);
            }
            else
            {
                var exception = Assert.Throws<JsonException>(() => TypeSpecSerialization.Deserialize(root.ToJsonString()));
                Assert.That(exception!.Message, Does.Contain("cannot resolve reference payload-model"));
            }
        }

        [Test]
        public void LoadsReferenceDefinedInOpaqueExampleType([Values("unknown", "union")] string kind)
        {
            var value = DeserializeExampleValue($$"""
                {
                  "kind": "{{kind}}",
                  "type": { "$id": "model", "kind": "model", "name": "SharedModel" },
                  "value": { "$id": "model", "name": "Payload" }
                }
                """, root => root["models"]!.AsArray().Add(new JsonObject { ["$ref"] = "model" }));

            Assert.AreEqual("SharedModel", value.Type.Name);
            Assert.AreEqual("Payload", ((InputExampleRawValue)((InputExampleObjectValue)value).Values["name"]).RawValue);
        }

        [Test]
        public void OpaqueExampleTypeStillDefinesReferences()
        {
            var value = DeserializeExampleValue("""
                {
                  "kind": "unknown",
                  "type": {
                    "kind": "array", "name": "Array",
                    "valueType": { "$ref": "element" },
                    "decorators": [{
                      "name": "example",
                      "arguments": {
                        "payload": {
                          "kind": "unknown", "type": {},
                          "value": { "$id": "element", "kind": "model", "name": "Element", "properties": [] }
                        }
                      }
                    }]
                  },
                  "value": { "$id": "element" }
                }
                """);

            Assert.AreEqual("Element", ((InputArrayType)value.Type).ValueType.Name);
            Assert.AreEqual("element", ((InputExampleRawValue)((InputExampleObjectValue)value).Values["$id"]).RawValue);
        }

        private static InputExampleValue DeserializeExampleValue(string exampleValue, Action<JsonNode>? update = null)
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false, method: nameof(LoadOperationExamples));
            var root = JsonNode.Parse(File.ReadAllText(Path.Combine(directory, "tspCodeModel.json")))!;
            var example = root["clients"]![0]!["children"]![0]!["methods"]![0]!["operation"]!["examples"]![0]!["parameters"]![0]!;
            example["value"] = JsonNode.Parse(exampleValue, documentOptions: new JsonDocumentOptions { MaxDepth = 128 });
            update?.Invoke(root);

            var input = TypeSpecSerialization.Deserialize(root.ToJsonString(new JsonSerializerOptions { MaxDepth = 128 }))!;
            return input.Clients[0].Children[0].Methods[0].Operation.Examples[0].Parameters[0].ExampleValue;
        }

        [Test]
        public void LoadOperationExamples()
        {
            var directory = Helpers.GetAssetFileOrDirectoryPath(false);
            // this tspCodeModel.json contains a partial part of the full tspCodeModel.json
            var content = File.ReadAllText(Path.Combine(directory, "tspCodeModel.json"));
            var input = TypeSpecSerialization.Deserialize(content)!;
            Assert.IsNotNull(input);

            var rootClient = input.Clients[0];
            Assert.IsNotNull(rootClient);
            AssertOperationListClientExample(rootClient.Children[0]);

            // assert a real resource client
            AssertStorageTaskClientExample(rootClient.Children[1]);

            static void AssertOperationListClientExample(InputClient client)
            {
                Assert.IsNotNull(client);
                var method = client.Methods[0];
                Assert.IsNotNull(method);
                var examples = method.Operation.Examples;
                Assert.AreEqual(1, examples.Count);
                var example = examples[0];
                Assert.AreEqual("OperationsList", example.Name);
                Assert.AreEqual("OperationsList", example.Description);
                Assert.AreEqual("2023-01-01/misc/OperationsList.json", example.FilePath);
                Assert.AreEqual(1, example.Parameters.Count);
                var parameter = method.Operation.Parameters[0];
                Assert.AreSame(parameter, example.Parameters[0].Parameter);
                var exampleValue = example.Parameters[0].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(exampleValue);
                Assert.AreEqual("2023-01-01", exampleValue!.RawValue);
                Assert.IsTrue(exampleValue.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
            }

            static void AssertStorageTaskClientExample(InputClient client)
            {
                Assert.IsNotNull(client);
                // check get operation example
                var method = client.Methods[0];
                Assert.IsNotNull(method);
                var examples = method.Operation.Examples;
                Assert.AreEqual(1, examples.Count);
                var example = examples[0];
                Assert.AreEqual("GetStorageTask", example.Name);
                Assert.AreEqual("GetStorageTask", example.Description);
                Assert.AreEqual("2023-01-01/storageTasksCrud/GetStorageTask.json", example.FilePath);
                Assert.AreEqual(4, example.Parameters.Count);
                var exampleValue1 = example.Parameters[0].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(exampleValue1);
                Assert.AreEqual("2023-01-01", exampleValue1!.RawValue);
                Assert.IsTrue(exampleValue1.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
                var exampleValue2 = example.Parameters[1].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(exampleValue2);
                Assert.IsTrue(exampleValue2!.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
                Assert.AreEqual("res4228", exampleValue2.RawValue);
                var exampleValue3 = example.Parameters[2].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(exampleValue3);
                Assert.IsTrue(exampleValue3!.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
                Assert.AreEqual("myTask1", exampleValue3.RawValue);
                var exampleValue4 = example.Parameters[3].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(exampleValue4);
                Assert.IsTrue(exampleValue4!.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
                Assert.AreEqual("1f31ba14-ce16-4281-b9b4-3e78da6e1616", exampleValue4.RawValue);

                // check put operation example
                var putMethod = client.Methods[1];
                Assert.IsNotNull(putMethod);
                var putExamples = putMethod.Operation.Examples;
                Assert.AreEqual(1, putExamples.Count);
                var putExample = putExamples[0];
                Assert.AreEqual("PutStorageTask", putExample.Name);
                Assert.AreEqual("PutStorageTask", putExample.Description);
                Assert.AreEqual("2023-01-01/storageTasksCrud/PutStorageTask.json", putExample.FilePath);
                Assert.AreEqual(5, putExample.Parameters.Count);

                // Check first parameter (api-version)
                var putExampleValue1 = putExample.Parameters[0].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(putExampleValue1);
                Assert.AreEqual("2023-01-01", putExampleValue1!.RawValue);
                Assert.IsTrue(putExampleValue1.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });

                // Check second parameter (body) - this is a model type
                var putExampleValue2 = putExample.Parameters[1].ExampleValue as InputExampleObjectValue;
                Assert.IsNotNull(putExampleValue2);
                Assert.IsTrue(putExampleValue2!.Type is InputModelType);

                // Validate the complex object
                var actualValues = ExtractObjectValues(putExampleValue2);
                var expectedValues = new Dictionary<string, object>
                {
                    { "identity.type", "SystemAssigned" },
                    { "location", "westus" },
                    { "properties.description", "My Storage task" },
                    { "properties.enabled", true },
                    { "properties.$filter", "status eq 'Active'" },
                    { "properties.action.if.condition", "[[equals(AccessTier, 'Cool')]]" },
                    { "properties.action.if.operations[0].name", "SetBlobTier" },
                    { "properties.action.if.operations[0].onFailure", "break" },
                    { "properties.action.if.operations[0].onSuccess", "continue" },
                    { "properties.action.if.operations[0].parameters.tier", "Hot" },
                    { "properties.action.else.operations[0].name", "DeleteBlob" },
                    { "properties.action.else.operations[0].onFailure", "break" },
                    { "properties.action.else.operations[0].onSuccess", "continue" }
                };

                ValidateObjectValues(expectedValues, actualValues);

                // Check third parameter (resourceGroupName)
                var putExampleValue3 = putExample.Parameters[2].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(putExampleValue3);
                Assert.IsTrue(putExampleValue3!.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
                Assert.AreEqual("res4228", putExampleValue3.RawValue);

                // Check fourth parameter (storageTaskName)
                var putExampleValue4 = putExample.Parameters[3].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(putExampleValue4);
                Assert.IsTrue(putExampleValue4!.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
                Assert.AreEqual("myTask1", putExampleValue4.RawValue);

                // Check fifth parameter (subscriptionId)
                var putExampleValue5 = putExample.Parameters[4].ExampleValue as InputExampleRawValue;
                Assert.IsNotNull(putExampleValue5);
                Assert.IsTrue(putExampleValue5!.Type is InputPrimitiveType { Kind: InputPrimitiveTypeKind.String });
                Assert.AreEqual("1f31ba14-ce16-4281-b9b4-3e78da6e1616", putExampleValue5.RawValue);
            }
        }

        /// <summary>
        /// Helper method to extract all values from an InputExampleObjectValue into a flattened dictionary
        /// using dot notation for nested properties and array indexing for list items
        /// </summary>
        private static Dictionary<string, object> ExtractObjectValues(InputExampleObjectValue objectValue, string prefix = "")
        {
            var result = new Dictionary<string, object>();

            foreach (var kvp in objectValue.Values)
            {
                var key = string.IsNullOrEmpty(prefix) ? kvp.Key : $"{prefix}.{kvp.Key}";

                switch (kvp.Value)
                {
                    case InputExampleRawValue rawValue:
                        result[key] = rawValue.RawValue!;
                        break;

                    case InputExampleObjectValue nestedObject:
                        var nestedValues = ExtractObjectValues(nestedObject, key);
                        foreach (var nestedKvp in nestedValues)
                        {
                            result[nestedKvp.Key] = nestedKvp.Value;
                        }
                        break;

                    case InputExampleListValue listValue:
                        for (int i = 0; i < listValue.Values.Count; i++)
                        {
                            var arrayKey = $"{key}[{i}]";
                            if (listValue.Values[i] is InputExampleObjectValue arrayObject)
                            {
                                var arrayValues = ExtractObjectValues(arrayObject, arrayKey);
                                foreach (var arrayKvp in arrayValues)
                                {
                                    result[arrayKvp.Key] = arrayKvp.Value;
                                }
                            }
                            else if (listValue.Values[i] is InputExampleRawValue arrayRaw)
                            {
                                result[arrayKey] = arrayRaw.RawValue!;
                            }
                        }
                        break;
                }
            }

            return result;
        }

        /// <summary>
        /// Helper method to validate that all expected values are present in the actual values
        /// </summary>
        private static void ValidateObjectValues(Dictionary<string, object> expected, Dictionary<string, object> actual)
        {
            foreach (var expectedKvp in expected)
            {
                Assert.IsTrue(actual.ContainsKey(expectedKvp.Key),
                    $"Expected key '{expectedKvp.Key}' not found in actual values");
                Assert.AreEqual(expectedKvp.Value, actual[expectedKvp.Key],
                    $"Value mismatch for key '{expectedKvp.Key}'");
            }
        }
    }
}
