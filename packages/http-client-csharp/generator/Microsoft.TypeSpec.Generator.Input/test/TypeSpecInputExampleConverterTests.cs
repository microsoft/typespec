using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class TypeSpecInputExampleConverterTests
    {
        [TestCase("unknown", false)]
        [TestCase("unknown", true)]
        [TestCase("union", false)]
        [TestCase("union", true)]
        public void OpaqueExampleValuesPreserveReferenceProperties(string kind, bool arrayValue)
        {
            const string payload = """
                {
                  "$id": "https://example.com/person.schema.json",
                  "$ref": "not-a-code-model-reference",
                  "$values": [
                    { "$id": "client", "$ref": "parameter", "$values": [] },
                    { "$id": "client" },
                    { "$id": 42, "$ref": null, "$values": true },
                    { "$ref": "missing" }
                  ],
                  "kind": "model",
                  "type": { "$id": "example-type" }
                }
                """;
            var value = arrayValue ? $"[{payload}, {payload}]" : payload;
            var type = kind == "union"
                ? """{ "$id": "example-type", "kind": "union", "name": "Union", "variantTypes": [{ "kind": "unknown" }] }"""
                : """{ "$id": "example-type", "kind": "unknown" }""";
            var examples = $$"""
                { "kind": "{{kind}}", "type": {{type}}, "value": {{value}} },
                { "kind": "{{kind}}", "type": { "$ref": "example-type" }, "value": {{value}} }
                """;

            var operation = DeserializeExamples(examples).Clients[0].Methods[0].Operation;
            using var expected = JsonDocument.Parse(value);

            foreach (var example in operation.Examples)
            {
                var parameterExample = example.Parameters[0];
                Assert.AreSame(operation.Parameters[0], parameterExample.Parameter);
                Assert.AreSame(operation.Parameters[0].Type, parameterExample.ExampleValue.Type);
                AssertExampleValue(expected.RootElement, parameterExample.ExampleValue);
            }
        }

        [TestCase("unknown")]
        [TestCase("union")]
        public void ReferencesCannotResolveDefinitionsInsideOpaqueExamples(string kind)
        {
            var examples = $$"""
                {
                  "kind": "{{kind}}",
                  "type": { "$id": "example-type", "kind": "unknown" },
                  "value": { "$id": "payload-model", "kind": "model", "name": "PayloadModel" }
                }
                """;

            var exception = Assert.Throws<JsonException>(() => DeserializeExamples(examples, """[{ "$ref": "payload-model" }]"""));

            Assert.That(exception!.Message, Does.Contain("cannot resolve reference payload-model"));
        }

        [TestCase("model")]
        [TestCase("dict")]
        public void ObjectExampleValuesPreserveReferencePropertyNames(string kind)
        {
            var type = kind == "model"
                ? """{ "$id": "example-type", "kind": "model", "name": "Model" }"""
                : """{ "$id": "example-type", "kind": "dict", "keyType": { "kind": "string" }, "valueType": { "kind": "unknown" } }""";
            var examples = $$"""
                {
                  "kind": "{{kind}}",
                  "type": {{type}},
                  "value": {
                    "$id": { "kind": "string", "type": { "kind": "string" }, "value": "user-id" },
                    "$ref": { "kind": "string", "type": { "kind": "string" }, "value": "user-ref" },
                    "$values": {
                      "kind": "unknown",
                      "type": { "kind": "unknown" },
                      "value": [{ "$id": "client", "$ref": "missing", "$values": [] }]
                    }
                  }
                }
                """;

            var operation = DeserializeExamples(examples).Clients[0].Methods[0].Operation;
            using var expected = JsonDocument.Parse("""
                {
                  "$id": "user-id",
                  "$ref": "user-ref",
                  "$values": [{ "$id": "client", "$ref": "missing", "$values": [] }]
                }
                """);

            Assert.AreSame(operation.Parameters[0].Type, operation.Examples[0].Parameters[0].ExampleValue.Type);
            AssertExampleValue(expected.RootElement, operation.Examples[0].Parameters[0].ExampleValue);
        }

        private static InputNamespace DeserializeExamples(string exampleValues, string models = "[]")
        {
            using var values = JsonDocument.Parse($"[{exampleValues}]");
            var examples = new List<string>();
            foreach (var value in values.RootElement.EnumerateArray())
            {
                examples.Add($$"""
                    {
                      "name": "Example",
                      "filePath": "example.json",
                      "parameters": [{
                        "parameter": { "$ref": "parameter" },
                        "value": {{value.GetRawText()}}
                      }]
                    }
                    """);
            }
            var content = $$"""
                {
                  "name": "Test",
                  "clients": [{
                    "$id": "client",
                    "name": "Client",
                    "methods": [{
                      "$id": "method",
                      "kind": "basic",
                      "name": "Method",
                      "crossLanguageDefinitionId": "Test.Method",
                      "response": {},
                      "operation": {
                        "$id": "operation",
                        "name": "Operation",
                        "httpMethod": "POST",
                        "uri": "https://example.com",
                        "path": "/",
                        "crossLanguageDefinitionId": "Test.Operation",
                        "parameters": [{
                          "$id": "parameter",
                          "kind": "method",
                          "name": "document",
                          "serializedName": "document",
                          "location": "body",
                          "scope": "method",
                          "type": { "$ref": "example-type" }
                        }],
                        "examples": [{{string.Join(",", examples)}}]
                      }
                    }]
                  }],
                  "models": {{models}}
                }
                """;
            return TypeSpecSerialization.Deserialize(content)!;
        }

        private static void AssertExampleValue(JsonElement expected, InputExampleValue actual)
        {
            switch (expected.ValueKind)
            {
                case JsonValueKind.Object:
                    Assert.IsInstanceOf<InputExampleObjectValue>(actual);
                    var objectValue = (InputExampleObjectValue)actual;
                    var propertyCount = 0;
                    foreach (var property in expected.EnumerateObject())
                    {
                        Assert.That(objectValue.Values.ContainsKey(property.Name), Is.True, property.Name);
                        AssertExampleValue(property.Value, objectValue.Values[property.Name]);
                        propertyCount++;
                    }
                    Assert.AreEqual(propertyCount, objectValue.Values.Count);
                    break;
                case JsonValueKind.Array:
                    Assert.IsInstanceOf<InputExampleListValue>(actual);
                    var listValue = (InputExampleListValue)actual;
                    Assert.AreEqual(expected.GetArrayLength(), listValue.Values.Count);
                    for (var i = 0; i < expected.GetArrayLength(); i++)
                    {
                        AssertExampleValue(expected[i], listValue.Values[i]);
                    }
                    break;
                default:
                    Assert.IsInstanceOf<InputExampleRawValue>(actual);
                    Assert.AreEqual(expected.GetRawText(), JsonSerializer.Serialize(((InputExampleRawValue)actual).RawValue));
                    break;
            }
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
