using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class TypeSpecInputConverterTests
    {
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
