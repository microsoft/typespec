// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Buffers;
using System.Linq;
using System.Text;
using System.Text.Json;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class ModelSerializationExtensionsTests
    {
        [TestCase(0, "D")]
        [TestCase(1, "D")]
        [TestCase(2, "D")]
        [TestCase(3, "D")]
        [TestCase(4096, "D")]
        [TestCase(0, "U")]
        [TestCase(1, "U")]
        [TestCase(2, "U")]
        [TestCase(3, "U")]
        [TestCase(4096, "U")]
        public void WriteBase64StringValueMatchesExistingFormat(int payloadSize, string format)
        {
            byte[] payload = Enumerable.Range(0, payloadSize).Select(i => (byte)(i * 37)).ToArray();

            AssertBase64Value(payload, format);
        }

        // payloads below encode to base64 values containing the url unsafe characters '+' and '/'
        // as well as the various padding combinations
        [TestCase(new byte[] { 0xFB, 0xFF }, "U", "+/8=")]
        [TestCase(new byte[] { 0xFB, 0xFF, 0xBF }, "U", "+/+/")]
        [TestCase(new byte[] { 0xFF }, "U", "/w==")]
        [TestCase(new byte[] { 0x03, 0xEF, 0xFF }, "U", "A+//")]
        [TestCase(new byte[] { 0xFB, 0xFF }, "D", "+/8=")]
        [TestCase(new byte[] { 0xFB, 0xFF, 0xBF }, "D", "+/+/")]
        [TestCase(new byte[] { 0xFF }, "D", "/w==")]
        [TestCase(new byte[] { 0x03, 0xEF, 0xFF }, "D", "A+//")]
        public void WriteBase64StringValueHandlesUrlUnsafeCharacters(byte[] payload, string format, string base64)
        {
            Assert.AreEqual(base64, Convert.ToBase64String(payload));

            AssertBase64Value(payload, format);
        }

        private static void AssertBase64Value(byte[] payload, string format)
        {
            string expected = Convert.ToBase64String(payload);
            if (format == "U")
            {
                expected = expected.Replace('+', '-').Replace('/', '_').TrimEnd('=');
            }
            expected = $"\"{expected}\"";

            var binaryDataOutput = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(binaryDataOutput))
            {
                writer.WriteBase64StringValue(BinaryData.FromBytes(payload), format);
            }
            Assert.AreEqual(expected, Encoding.UTF8.GetString(binaryDataOutput.WrittenSpan));

            var byteArrayOutput = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(byteArrayOutput))
            {
                writer.WriteBase64StringValue(payload, format);
            }
            Assert.AreEqual(expected, Encoding.UTF8.GetString(byteArrayOutput.WrittenSpan));
        }
    }
}
