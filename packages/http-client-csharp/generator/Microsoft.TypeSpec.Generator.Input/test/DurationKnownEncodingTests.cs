// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class DurationKnownEncodingTests
    {
        [TestCase("duration-constant")]
        [TestCase("Constant")]
        [TestCase("iso8601")]
        [TestCase("Iso8601")]
        [TestCase("seconds")]
        [TestCase("Seconds")]
        [TestCase("milliseconds")]
        [TestCase("Milliseconds")]
        public void CanCreateFromString(string encoding)
        {
            var parsedEncoding = new DurationKnownEncoding(encoding);
            Assert.IsNotNull(parsedEncoding);
            Assert.AreEqual(encoding, parsedEncoding.ToString());
        }

        [Test]
        public void KnownEncodingsAreEqual()
        {
            Assert.AreEqual(DurationKnownEncoding.Iso8601, new DurationKnownEncoding("Iso8601"));
            Assert.AreEqual(DurationKnownEncoding.Seconds, new DurationKnownEncoding("Seconds"));
            Assert.AreEqual(DurationKnownEncoding.Constant, new DurationKnownEncoding("Constant"));
            Assert.AreEqual(DurationKnownEncoding.Milliseconds, new DurationKnownEncoding("Milliseconds"));
        }

        [Test]
        public void CustomEncodingWorks()
        {
            var customEncoding = new DurationKnownEncoding("custom-format");
            Assert.AreEqual("custom-format", customEncoding.ToString());
        }
    }
}
