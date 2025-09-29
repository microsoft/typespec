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
    }
}
