// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_file;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyFileTests : TestServerTestBase
    {
        private string SamplePngPath = Path.Combine(TestServerV1.GetBaseDirectory(), "routes", "sample.png");

        [Test]
        public Task FileStreamEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new FilesClient(ClientDiagnostics, pipeline, host).GetEmptyFileAsync();
            Assert.AreEqual(0, await result.Value.ReadAsync(new byte[10]));
        });

        [Test]
        public Task FileStreamNonempty() => Test(async (host, pipeline) =>
        {
            var result = await new FilesClient(ClientDiagnostics, pipeline, host).GetFileAsync();
            var memoryStream = new MemoryStream();
            await result.Value.CopyToAsync(memoryStream);

            CollectionAssert.AreEqual(File.ReadAllBytes(SamplePngPath), memoryStream.ToArray());
        });

        [Test]
        public Task FileStreamVeryLarge() => Test(async (host, pipeline) =>
        {
            var result = await new FilesClient(ClientDiagnostics, pipeline, host).GetFileLargeAsync();
            var buffer = new byte[2 * 1024 * 1024L];
            var stream = result.Value;
            long total = 0;
            var count = await stream.ReadAsync(buffer, 0, buffer.Length);
            while (count > 0)
            {
                total += count;
                count = await stream.ReadAsync(buffer, 0, buffer.Length);
            }

            Assert.AreEqual(3000 * 1024 * 1024L, total);
            Assert.False(stream.CanSeek);
            await result.Value.DisposeAsync().ConfigureAwait(false);
        }, ignoreScenario: false, useSimplePipeline: true);

        [Test]
        public Task FileStreamVeryLarge_Sync() => Test((host, pipeline) =>
        {
            var result = new FilesClient(ClientDiagnostics, pipeline, host).GetFileLarge();
            var buffer = new byte[2 * 1024 * 1024L];
            var stream = result.Value;

            long total = 0;
            var count = stream.Read(buffer, 0, buffer.Length);
            while (count > 0)
            {
                total += count;
                count = stream.Read(buffer, 0, buffer.Length);
            }

            Assert.AreEqual(3000 * 1024 * 1024L, total);
            Assert.False(stream.CanSeek);
            result.Value.Dispose();
        }, ignoreScenario: false, useSimplePipeline: true);
    }
}
