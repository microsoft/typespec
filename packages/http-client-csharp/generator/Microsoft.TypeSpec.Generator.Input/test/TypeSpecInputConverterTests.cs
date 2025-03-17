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

            var nextLinkOperation = inputNamespace.Clients.First().Operations.FirstOrDefault(x => x.Name == "ListWithNextLink");
            Assert.IsNotNull(nextLinkOperation);
            Assert.IsNotNull(nextLinkOperation!.Paging);

            var nextLink = nextLinkOperation.Paging!.NextLink;
            Assert.IsNotNull(nextLink);
            Assert.AreEqual(1, nextLink!.ResponseSegments.Count);
            Assert.AreEqual("next", nextLink.ResponseSegments[0]);
            Assert.AreEqual(InputResponseLocation.Body, nextLink.ResponseLocation);

            var continuationOperation = inputNamespace.Clients.First().Operations.FirstOrDefault(x => x.Name == "ListWithContinuationToken");
            Assert.IsNotNull(continuationOperation);
            Assert.IsNotNull(continuationOperation!.Paging);

            var continuation = continuationOperation.Paging!.ContinuationToken;
            Assert.IsNotNull(continuation);
            Assert.AreEqual(1, continuation!.ResponseSegments.Count);
            Assert.AreEqual("nextToken", continuation.ResponseSegments[0]);
            Assert.AreEqual(InputResponseLocation.Header, continuation.ResponseLocation);
            Assert.AreEqual("token", continuation.Parameter.Name);
        }
    }
}
