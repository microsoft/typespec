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
    }
}
