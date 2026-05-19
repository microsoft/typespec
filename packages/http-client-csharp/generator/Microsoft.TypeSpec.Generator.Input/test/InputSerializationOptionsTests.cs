// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using System.Text.Json.Serialization;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputSerializationOptionsTests
    {
        private static JsonSerializerOptions CreateOptions()
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

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateOptions());

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

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateOptions());

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

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateOptions());

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
                    "contentTypes": [ "application/octet-stream" ]
                  }
                }
                """;

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Binary);
            Assert.IsTrue(result.Binary!.IsFile);
            Assert.AreEqual(false, result.Binary.IsText);
            Assert.IsNotNull(result.Binary.ContentTypes);
            Assert.AreEqual(1, result.Binary.ContentTypes!.Count);
            Assert.AreEqual("application/octet-stream", result.Binary.ContentTypes[0]);
        }

        [Test]
        public void ParsesBinarySerializationOptionsWithDefaults()
        {
            const string json = """
                {
                  "binary": { "isFile": false }
                }
                """;

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Binary);
            Assert.IsFalse(result.Binary!.IsFile);
            Assert.IsNull(result.Binary.IsText);
            Assert.IsNull(result.Binary.ContentTypes);
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

            var result = JsonSerializer.Deserialize<InputBodyParameter>(json, CreateOptions());

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
                    "binary": { "isFile": true, "isText": false }
                  }
                }
                """;

            var result = JsonSerializer.Deserialize<InputBodyParameter>(json, CreateOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.SerializationOptions);
            Assert.IsNotNull(result.SerializationOptions!.Binary);
            Assert.IsTrue(result.SerializationOptions.Binary!.IsFile);
            Assert.AreEqual(false, result.SerializationOptions.Binary.IsText);
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

            var result = JsonSerializer.Deserialize<InputBodyParameter>(json, CreateOptions());

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

            var result = JsonSerializer.Deserialize<InputOperationResponse>(json, CreateOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.SerializationOptions);
            Assert.IsNotNull(result.SerializationOptions!.Xml);
            Assert.AreEqual("Book", result.SerializationOptions.Xml!.Name);
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

            var result = JsonSerializer.Deserialize<InputOperationResponse>(json, CreateOptions());

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

            var result = JsonSerializer.Deserialize<InputSerializationOptions>(json, CreateOptions());

            Assert.IsNotNull(result);
            Assert.IsNotNull(result!.Json);
            Assert.AreEqual("msg", result.Json!.Name);
        }
    }
}
