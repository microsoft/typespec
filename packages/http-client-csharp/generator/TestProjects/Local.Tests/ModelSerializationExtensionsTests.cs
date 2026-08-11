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
            var output = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(output))
            {
                writer.WriteBase64StringValue(BinaryData.FromBytes(payload), format);
            }

            string expected = Convert.ToBase64String(payload);
            if (format == "U")
            {
                expected = expected.Replace('+', '-').Replace('/', '_').TrimEnd('=');
            }

            Assert.AreEqual($"\"{expected}\"", Encoding.UTF8.GetString(output.WrittenSpan));
        }
    }
}
