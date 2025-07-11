// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input.Extensions;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class DurationKnownEncodingTests
    {
        [TestCase("duration-constant", DurationKnownEncoding.Constant)]
        [TestCase("constant", DurationKnownEncoding.Constant)]
        [TestCase("iso8601", DurationKnownEncoding.Iso8601)]
        [TestCase("seconds", DurationKnownEncoding.Seconds)]
        public void TryParseEachEncoding(string encoding, DurationKnownEncoding expectedEncoding)
        {
            var result = DurationKnownEncodingExtensions.TryParse(encoding, out var parsedEncoding);
            Assert.IsTrue(result);
            Assert.AreEqual(expectedEncoding, parsedEncoding);
        }

        [Test]
        public void TryParseInvalidEncoding()
        {
            var result = DurationKnownEncodingExtensions.TryParse("invalid-encoding", out var parsedEncoding);
            Assert.IsFalse(result);
            Assert.IsNull(parsedEncoding);
        }
    }
}
