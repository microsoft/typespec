// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_file_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyFileTests : TestServerLowLevelTestBase
    {
        private string SamplePngPath = Path.Combine(TestServerV1.GetBaseDirectory(), "routes", "sample.png");

        [Test]
        [Ignore("Enable this test case after https://github.com/Azure/autorest.csharp/issues/1161 resolved")]
        public Task FileStreamEmpty() => Test(async (host) =>
        {
            var result = await new FilesClient(host, Key, null).GetEmptyFileAsync(new());
            Assert.AreEqual(0, await result.ContentStream.ReadAsync(new byte[10]));
        });

        [Test]
        [Ignore("Enable this test case after https://github.com/Azure/autorest.csharp/issues/1161 resolved")]
        public Task FileStreamNonempty() => Test(async (host) =>
        {
            var result = await new FilesClient(host, Key, null).GetFileAsync(new());
            var memoryStream = new MemoryStream();
            await result.ContentStream.CopyToAsync(memoryStream);

            CollectionAssert.AreEqual(File.ReadAllBytes(SamplePngPath), memoryStream.ToArray());
        });

        [Test]
        [Ignore("Enable this test case after https://github.com/Azure/autorest.csharp/issues/1161 resolved")]
        public Task FileStreamVeryLarge() => Test(async (host) =>
        {
            var result = await new FilesClient(host, Key, null).GetFileLargeAsync(new());
            var buffer = new byte[2 * 1024 * 1024L];
            var stream = result.ContentStream;
            long total = 0;
            var count = await stream.ReadAsync(buffer, 0, buffer.Length);
            while (count > 0)
            {
                total += count;
                count = await stream.ReadAsync(buffer, 0, buffer.Length);
            }

            Assert.AreEqual(3000 * 1024 * 1024L, total);
            Assert.False(stream.CanSeek);
            await result.ContentStream.DisposeAsync().ConfigureAwait(false);
        }, ignoreScenario: false);
    }
}
