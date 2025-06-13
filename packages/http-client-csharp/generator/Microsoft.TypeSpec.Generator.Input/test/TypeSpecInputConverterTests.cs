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
    }
}
