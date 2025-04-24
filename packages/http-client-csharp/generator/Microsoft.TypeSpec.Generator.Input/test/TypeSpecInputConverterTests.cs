using System.Linq;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class TypeSpecInputConverterTests
    {
        [Test]
        public void LoadsTypeSpecPagingInput()
        {
            var inputLibrary = new InputLibrary(Helpers.GetAssetFileOrDirectoryPath(false));
            var inputNamespace = inputLibrary.Load();

            var nextLinkMethod = inputNamespace.Clients.First().Methods.FirstOrDefault(x => x.Operation.Name == "ListWithNextLink");
            Assert.IsNotNull(nextLinkMethod);

            InputPagingServiceMetadata? nextLinkPaging = null;
            if (nextLinkMethod is InputPagingServiceMethod pagingServiceMethod)
            {
                nextLinkPaging = pagingServiceMethod.PagingMetadata;
            }
            else
            {
                Assert.Fail("Expected InputPagingServiceMethod");
            }

            Assert.IsNotNull(nextLinkPaging);
            var nextLink = nextLinkPaging!.NextLink;
            Assert.IsNotNull(nextLink);
            Assert.AreEqual(1, nextLink!.ResponseSegments.Count);
            Assert.AreEqual("next", nextLink.ResponseSegments[0]);
            Assert.AreEqual(InputResponseLocation.Body, nextLink.ResponseLocation);

            var continuationMethod = inputNamespace.Clients.First().Methods.FirstOrDefault(x => x.Operation.Name == "ListWithContinuationToken");
            Assert.IsNotNull(continuationMethod);

            InputPagingServiceMetadata? continuationPaging = null;
            if (continuationMethod is InputPagingServiceMethod continuationPagingServiceMethod)
            {
                continuationPaging = continuationPagingServiceMethod.PagingMetadata;
            }
            else
            {
                Assert.Fail("Expected InputPagingServiceMethod");
            }
            Assert.IsNotNull(continuationPaging);

            var continuation = continuationPaging!.ContinuationToken;
            Assert.IsNotNull(continuation);
            Assert.AreEqual(1, continuation!.ResponseSegments.Count);
            Assert.AreEqual("nextToken", continuation.ResponseSegments[0]);
            Assert.AreEqual(InputResponseLocation.Header, continuation.ResponseLocation);
            Assert.AreEqual("token", continuation.Parameter.Name);
        }
    }
}
