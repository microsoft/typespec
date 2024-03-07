// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using head_LowLevel;
using NUnit.Framework;
using static System.Reflection.BindingFlags;

namespace AutoRest.TestServer.Tests
{
    public class HeadRequestTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task HttpSuccess200Head() => Test(async (host) =>
        {
            var response = await new HttpSuccessClient(host, Key, null).Head200Async();
            Assert.AreEqual(200, response.Status);
        });

        [Test]
        public Task HttpSuccess204Head() => Test(async (host) =>
        {
            var response = await new HttpSuccessClient(host, Key, null).Head204Async();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task HttpSuccess404Head() => Test(async (host) =>
        {
            var response = await new HttpSuccessClient(host, Key, null).Head404Async();
            Assert.AreEqual(404, response.Status);
        });

        [Test]
        public void ValidateHead200()
        {
            var methodInfo = typeof(HttpSuccessClient).GetMethod("Head200", Instance | Public);
            Assert.NotNull(methodInfo);
            Assert.AreEqual(typeof(Response), methodInfo.ReturnType);
        }

        [Test]
        public void ValidateHead204()
        {
            var methodInfo = typeof(HttpSuccessClient).GetMethod("Head204", Instance | Public);
            Assert.NotNull(methodInfo);
            Assert.AreEqual(typeof(Response), methodInfo.ReturnType);
        }

        [Test]
        public void ValidateHead404()
        {
            var methodInfo = typeof(HttpSuccessClient).GetMethod("Head404", Instance | Public);
            Assert.NotNull(methodInfo);
            Assert.AreEqual(typeof(Response), methodInfo.ReturnType);
        }
    }
}
