using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputParameterReferenceTests
    {
        [Test]
        public void TestCorrespondingMethodParamsWithReference()
        {
            // Test that when correspondingMethodParams contains a reference to an InputMethodParameter,
            // it is properly resolved during deserialization
            var json = @"{
  ""methods"": [
    {
      ""$id"": ""1"",
      ""name"": ""TestMethod"",
      ""crossLanguageDefinitionId"": ""Test.TestMethod"",
      ""access"": ""public"",
      ""kind"": ""basic"",
      ""decorators"": [],
      ""resourceName"": null,
      ""resourceTypeKey"": null,
      ""parameters"": [
        {
          ""$id"": ""2"",
          ""name"": ""param1"",
          ""serializedName"": ""param1"",
          ""type"": {
            ""$id"": ""3"",
            ""kind"": ""string"",
            ""name"": ""string"",
            ""crossLanguageDefinitionId"": ""TypeSpec.string"",
            ""decorators"": []
          },
          ""location"": ""query"",
          ""optional"": false,
          ""readOnly"": false,
          ""isApiVersion"": false,
          ""decorators"": []
        }
      ],
      ""operation"": {
        ""$id"": ""4"",
        ""path"": ""/test"",
        ""verb"": ""get"",
        ""parameters"": [
          {
            ""$id"": ""5"",
            ""name"": ""queryParam"",
            ""nameInRequest"": ""q"",
            ""type"": {
              ""$ref"": ""3""
            },
            ""location"": ""query"",
            ""optional"": false,
            ""kind"": ""query"",
            ""isApiVersion"": false,
            ""decorators"": [],
            ""correspondingMethodParams"": [
              {
                ""$ref"": ""2""
              }
            ]
          }
        ],
        ""responses"": [],
        ""buffered"": false
      }
    }
  ]
}";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                ReferenceHandler = referenceHandler,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputDictionaryTypeConverter(referenceHandler),
                    new InputEnumTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new TypeSpecInputNullableTypeConverter(referenceHandler),
                    new InputUnionTypeConverter(referenceHandler),
                    new InputLiteralTypeConverter(referenceHandler),
                    new InputDateTimeTypeConverter(referenceHandler),
                    new InputDurationTypeConverter(referenceHandler),
                    new InputArrayTypeConverter(referenceHandler),
                    new InputParameterConverter(referenceHandler),
                    new InputMethodParameterConverter(referenceHandler),
                    new InputQueryParameterConverter(referenceHandler),
                    new InputPathParameterConverter(referenceHandler),
                    new InputHeaderParameterConverter(referenceHandler),
                    new InputBodyParameterConverter(referenceHandler),
                    new InputOperationConverter(referenceHandler),
                    new InputServiceMethodConverter(referenceHandler),
                }
            };

            var root = JsonSerializer.Deserialize<Dictionary<string, List<InputServiceMethod>>>(json, options);
            Assert.IsNotNull(root);
            
            var methods = root!["methods"];
            Assert.IsNotNull(methods);
            Assert.AreEqual(1, methods.Count);
            
            var method = methods[0];
            Assert.AreEqual("TestMethod", method.Name);
            Assert.AreEqual(1, method.Parameters.Count);
            
            var methodParam = method.Parameters[0];
            Assert.AreEqual("param1", methodParam.Name);
            
            // Check the operation has a query parameter
            var operation = method.Operation;
            Assert.IsNotNull(operation);
            Assert.AreEqual(1, operation.Parameters.Count);
            
            var queryParam = operation.Parameters[0] as InputQueryParameter;
            Assert.IsNotNull(queryParam);
            Assert.AreEqual("queryParam", queryParam!.Name);
            
            // Verify correspondingMethodParams was deserialized and references are resolved
            Assert.IsNotNull(queryParam.CorrespondingMethodParams);
            Assert.AreEqual(1, queryParam.CorrespondingMethodParams!.Count);
            
            var correspondingParam = queryParam.CorrespondingMethodParams[0];
            Assert.IsNotNull(correspondingParam);
            Assert.AreEqual("param1", correspondingParam.Name);
            
            // Verify it's the same instance (reference was resolved correctly)
            Assert.AreSame(methodParam, correspondingParam);
        }

        [Test]
        public void TestCorrespondingMethodParamsWithReferenceForPathParameter()
        {
            var json = @"{
  ""methods"": [
    {
      ""$id"": ""1"",
      ""name"": ""TestMethod"",
      ""crossLanguageDefinitionId"": ""Test.TestMethod"",
      ""access"": ""public"",
      ""kind"": ""basic"",
      ""decorators"": [],
      ""resourceName"": null,
      ""resourceTypeKey"": null,
      ""parameters"": [
        {
          ""$id"": ""2"",
          ""name"": ""pathParam1"",
          ""serializedName"": ""pathParam1"",
          ""type"": {
            ""$id"": ""3"",
            ""kind"": ""string"",
            ""name"": ""string"",
            ""crossLanguageDefinitionId"": ""TypeSpec.string"",
            ""decorators"": []
          },
          ""location"": ""path"",
          ""optional"": false,
          ""readOnly"": false,
          ""isApiVersion"": false,
          ""decorators"": []
        }
      ],
      ""operation"": {
        ""$id"": ""4"",
        ""path"": ""/test/{pathParam}"",
        ""verb"": ""get"",
        ""parameters"": [
          {
            ""$id"": ""5"",
            ""name"": ""pathParam"",
            ""nameInRequest"": ""pathParam"",
            ""type"": {
              ""$ref"": ""3""
            },
            ""location"": ""path"",
            ""optional"": false,
            ""kind"": ""path"",
            ""isApiVersion"": false,
            ""decorators"": [],
            ""correspondingMethodParams"": [
              {
                ""$ref"": ""2""
              }
            ]
          }
        ],
        ""responses"": [],
        ""buffered"": false
      }
    }
  ]
}";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                ReferenceHandler = referenceHandler,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputDictionaryTypeConverter(referenceHandler),
                    new InputEnumTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new TypeSpecInputNullableTypeConverter(referenceHandler),
                    new InputUnionTypeConverter(referenceHandler),
                    new InputLiteralTypeConverter(referenceHandler),
                    new InputDateTimeTypeConverter(referenceHandler),
                    new InputDurationTypeConverter(referenceHandler),
                    new InputArrayTypeConverter(referenceHandler),
                    new InputParameterConverter(referenceHandler),
                    new InputMethodParameterConverter(referenceHandler),
                    new InputQueryParameterConverter(referenceHandler),
                    new InputPathParameterConverter(referenceHandler),
                    new InputHeaderParameterConverter(referenceHandler),
                    new InputBodyParameterConverter(referenceHandler),
                    new InputOperationConverter(referenceHandler),
                    new InputServiceMethodConverter(referenceHandler),
                }
            };

            var root = JsonSerializer.Deserialize<Dictionary<string, List<InputServiceMethod>>>(json, options);
            Assert.IsNotNull(root);
            
            var methods = root!["methods"];
            var method = methods[0];
            var methodParam = method.Parameters[0];
            
            var pathParam = method.Operation.Parameters[0] as InputPathParameter;
            Assert.IsNotNull(pathParam);
            Assert.IsNotNull(pathParam!.CorrespondingMethodParams);
            Assert.AreEqual(1, pathParam.CorrespondingMethodParams!.Count);
            Assert.AreSame(methodParam, pathParam.CorrespondingMethodParams[0]);
        }

        [Test]
        public void TestCorrespondingMethodParamsWithReferenceForHeaderParameter()
        {
            var json = @"{
  ""methods"": [
    {
      ""$id"": ""1"",
      ""name"": ""TestMethod"",
      ""crossLanguageDefinitionId"": ""Test.TestMethod"",
      ""access"": ""public"",
      ""kind"": ""basic"",
      ""decorators"": [],
      ""resourceName"": null,
      ""resourceTypeKey"": null,
      ""parameters"": [
        {
          ""$id"": ""2"",
          ""name"": ""headerParam1"",
          ""serializedName"": ""headerParam1"",
          ""type"": {
            ""$id"": ""3"",
            ""kind"": ""string"",
            ""name"": ""string"",
            ""crossLanguageDefinitionId"": ""TypeSpec.string"",
            ""decorators"": []
          },
          ""location"": ""header"",
          ""optional"": false,
          ""readOnly"": false,
          ""isApiVersion"": false,
          ""decorators"": []
        }
      ],
      ""operation"": {
        ""$id"": ""4"",
        ""path"": ""/test"",
        ""verb"": ""get"",
        ""parameters"": [
          {
            ""$id"": ""5"",
            ""name"": ""headerParam"",
            ""nameInRequest"": ""X-Header"",
            ""type"": {
              ""$ref"": ""3""
            },
            ""location"": ""header"",
            ""optional"": false,
            ""kind"": ""header"",
            ""isApiVersion"": false,
            ""decorators"": [],
            ""correspondingMethodParams"": [
              {
                ""$ref"": ""2""
              }
            ]
          }
        ],
        ""responses"": [],
        ""buffered"": false
      }
    }
  ]
}";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                ReferenceHandler = referenceHandler,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputDictionaryTypeConverter(referenceHandler),
                    new InputEnumTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new TypeSpecInputNullableTypeConverter(referenceHandler),
                    new InputUnionTypeConverter(referenceHandler),
                    new InputLiteralTypeConverter(referenceHandler),
                    new InputDateTimeTypeConverter(referenceHandler),
                    new InputDurationTypeConverter(referenceHandler),
                    new InputArrayTypeConverter(referenceHandler),
                    new InputParameterConverter(referenceHandler),
                    new InputMethodParameterConverter(referenceHandler),
                    new InputQueryParameterConverter(referenceHandler),
                    new InputPathParameterConverter(referenceHandler),
                    new InputHeaderParameterConverter(referenceHandler),
                    new InputBodyParameterConverter(referenceHandler),
                    new InputOperationConverter(referenceHandler),
                    new InputServiceMethodConverter(referenceHandler),
                }
            };

            var root = JsonSerializer.Deserialize<Dictionary<string, List<InputServiceMethod>>>(json, options);
            Assert.IsNotNull(root);
            
            var methods = root!["methods"];
            var method = methods[0];
            var methodParam = method.Parameters[0];
            
            var headerParam = method.Operation.Parameters[0] as InputHeaderParameter;
            Assert.IsNotNull(headerParam);
            Assert.IsNotNull(headerParam!.CorrespondingMethodParams);
            Assert.AreEqual(1, headerParam.CorrespondingMethodParams!.Count);
            Assert.AreSame(methodParam, headerParam.CorrespondingMethodParams[0]);
        }

        [Test]
        public void TestCorrespondingMethodParamsWithReferenceForBodyParameter()
        {
            var json = @"{
  ""methods"": [
    {
      ""$id"": ""1"",
      ""name"": ""TestMethod"",
      ""crossLanguageDefinitionId"": ""Test.TestMethod"",
      ""access"": ""public"",
      ""kind"": ""basic"",
      ""decorators"": [],
      ""resourceName"": null,
      ""resourceTypeKey"": null,
      ""parameters"": [
        {
          ""$id"": ""2"",
          ""name"": ""bodyParam1"",
          ""serializedName"": ""bodyParam1"",
          ""type"": {
            ""$id"": ""3"",
            ""kind"": ""model"",
            ""name"": ""TestModel"",
            ""crossLanguageDefinitionId"": ""Test.TestModel"",
            ""access"": ""public"",
            ""usage"": ""input"",
            ""decorators"": [],
            ""properties"": []
          },
          ""location"": ""body"",
          ""optional"": false,
          ""readOnly"": false,
          ""isApiVersion"": false,
          ""decorators"": []
        }
      ],
      ""operation"": {
        ""$id"": ""4"",
        ""path"": ""/test"",
        ""verb"": ""post"",
        ""parameters"": [
          {
            ""$id"": ""5"",
            ""name"": ""body"",
            ""nameInRequest"": ""body"",
            ""type"": {
              ""$ref"": ""3""
            },
            ""location"": ""body"",
            ""optional"": false,
            ""kind"": ""body"",
            ""isApiVersion"": false,
            ""decorators"": [],
            ""contentTypes"": [""application/json""],
            ""correspondingMethodParams"": [
              {
                ""$ref"": ""2""
              }
            ]
          }
        ],
        ""responses"": [],
        ""buffered"": false
      }
    }
  ]
}";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                ReferenceHandler = referenceHandler,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputDictionaryTypeConverter(referenceHandler),
                    new InputEnumTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new TypeSpecInputNullableTypeConverter(referenceHandler),
                    new InputUnionTypeConverter(referenceHandler),
                    new InputLiteralTypeConverter(referenceHandler),
                    new InputDateTimeTypeConverter(referenceHandler),
                    new InputDurationTypeConverter(referenceHandler),
                    new InputArrayTypeConverter(referenceHandler),
                    new InputParameterConverter(referenceHandler),
                    new InputMethodParameterConverter(referenceHandler),
                    new InputQueryParameterConverter(referenceHandler),
                    new InputPathParameterConverter(referenceHandler),
                    new InputHeaderParameterConverter(referenceHandler),
                    new InputBodyParameterConverter(referenceHandler),
                    new InputOperationConverter(referenceHandler),
                    new InputServiceMethodConverter(referenceHandler),
                }
            };

            var root = JsonSerializer.Deserialize<Dictionary<string, List<InputServiceMethod>>>(json, options);
            Assert.IsNotNull(root);
            
            var methods = root!["methods"];
            var method = methods[0];
            var methodParam = method.Parameters[0];
            
            var bodyParam = method.Operation.Parameters[0] as InputBodyParameter;
            Assert.IsNotNull(bodyParam);
            Assert.IsNotNull(bodyParam!.CorrespondingMethodParams);
            Assert.AreEqual(1, bodyParam.CorrespondingMethodParams!.Count);
            Assert.AreSame(methodParam, bodyParam.CorrespondingMethodParams[0]);
        }

        [Test]
        public void TestCorrespondingMethodParamsWithMultipleReferences()
        {
            // Test that multiple method parameters can map to a single protocol parameter
            var json = @"{
  ""methods"": [
    {
      ""$id"": ""1"",
      ""name"": ""TestMethod"",
      ""crossLanguageDefinitionId"": ""Test.TestMethod"",
      ""access"": ""public"",
      ""kind"": ""basic"",
      ""decorators"": [],
      ""resourceName"": null,
      ""resourceTypeKey"": null,
      ""parameters"": [
        {
          ""$id"": ""2"",
          ""name"": ""param1"",
          ""serializedName"": ""param1"",
          ""type"": {
            ""$id"": ""3"",
            ""kind"": ""string"",
            ""name"": ""string"",
            ""crossLanguageDefinitionId"": ""TypeSpec.string"",
            ""decorators"": []
          },
          ""location"": ""query"",
          ""optional"": false,
          ""readOnly"": false,
          ""isApiVersion"": false,
          ""decorators"": []
        },
        {
          ""$id"": ""4"",
          ""name"": ""param2"",
          ""serializedName"": ""param2"",
          ""type"": {
            ""$ref"": ""3""
          },
          ""location"": ""query"",
          ""optional"": false,
          ""readOnly"": false,
          ""isApiVersion"": false,
          ""decorators"": []
        }
      ],
      ""operation"": {
        ""$id"": ""5"",
        ""path"": ""/test"",
        ""verb"": ""get"",
        ""parameters"": [
          {
            ""$id"": ""6"",
            ""name"": ""combinedParam"",
            ""nameInRequest"": ""q"",
            ""type"": {
              ""$ref"": ""3""
            },
            ""location"": ""query"",
            ""optional"": false,
            ""kind"": ""query"",
            ""isApiVersion"": false,
            ""decorators"": [],
            ""correspondingMethodParams"": [
              {
                ""$ref"": ""2""
              },
              {
                ""$ref"": ""4""
              }
            ]
          }
        ],
        ""responses"": [],
        ""buffered"": false
      }
    }
  ]
}";

            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                ReferenceHandler = referenceHandler,
                Converters =
                {
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new InputTypeConverter(referenceHandler),
                    new InputPrimitiveTypeConverter(referenceHandler),
                    new InputDictionaryTypeConverter(referenceHandler),
                    new InputEnumTypeConverter(referenceHandler),
                    new InputModelTypeConverter(referenceHandler),
                    new TypeSpecInputNullableTypeConverter(referenceHandler),
                    new InputUnionTypeConverter(referenceHandler),
                    new InputLiteralTypeConverter(referenceHandler),
                    new InputDateTimeTypeConverter(referenceHandler),
                    new InputDurationTypeConverter(referenceHandler),
                    new InputArrayTypeConverter(referenceHandler),
                    new InputParameterConverter(referenceHandler),
                    new InputMethodParameterConverter(referenceHandler),
                    new InputQueryParameterConverter(referenceHandler),
                    new InputPathParameterConverter(referenceHandler),
                    new InputHeaderParameterConverter(referenceHandler),
                    new InputBodyParameterConverter(referenceHandler),
                    new InputOperationConverter(referenceHandler),
                    new InputServiceMethodConverter(referenceHandler),
                }
            };

            var root = JsonSerializer.Deserialize<Dictionary<string, List<InputServiceMethod>>>(json, options);
            Assert.IsNotNull(root);
            
            var methods = root!["methods"];
            var method = methods[0];
            Assert.AreEqual(2, method.Parameters.Count);
            var methodParam1 = method.Parameters[0];
            var methodParam2 = method.Parameters[1];
            
            var queryParam = method.Operation.Parameters[0] as InputQueryParameter;
            Assert.IsNotNull(queryParam);
            Assert.IsNotNull(queryParam!.CorrespondingMethodParams);
            Assert.AreEqual(2, queryParam.CorrespondingMethodParams!.Count);
            Assert.AreSame(methodParam1, queryParam.CorrespondingMethodParams[0]);
            Assert.AreSame(methodParam2, queryParam.CorrespondingMethodParams[1]);
        }
    }
}
