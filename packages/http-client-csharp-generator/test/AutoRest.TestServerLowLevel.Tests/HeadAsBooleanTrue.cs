// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using HeadAsBooleanTrue_LowLevel;
using NUnit.Framework;
using static System.Reflection.BindingFlags;

namespace AutoRest.TestServer.Tests
{
    public class HeadAsBooleanTrueTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task HttpSuccess200Head() => Test(async (host) =>
        {
            var response = await new HttpSuccessClient(host, Key, null).Head200Async(new());
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(true, response.Value);
        });

        [Test]
        public Task HttpSuccess204Head() => Test(async (host) =>
        {
            var response = await new HttpSuccessClient(host, Key, null).Head204Async(new());
            Assert.AreEqual(204, response.GetRawResponse().Status);
            Assert.AreEqual(true, response.Value);
        });

        [Test]
        public Task HttpSuccess404Head() => Test(async (host) =>
        {
            var response = await new HttpSuccessClient(host, Key, null).Head404Async(new());
            Assert.AreEqual(404, response.GetRawResponse().Status);
            Assert.AreEqual(false, response.Value);
        });

        [Test]
        public void ValidateHead200()
        {
            var methodInfo = typeof(HttpSuccessClient).GetMethod("Head200", Instance | Public);
            Assert.NotNull(methodInfo);
            Assert.AreEqual(typeof(Response<bool>), methodInfo.ReturnType);
        }

        [Test]
        public void ValidateHead204()
        {
            var methodInfo = typeof(HttpSuccessClient).GetMethod("Head204", Instance | Public);
            Assert.NotNull(methodInfo);
            Assert.AreEqual(typeof(Response<bool>), methodInfo.ReturnType);
        }

        [Test]
        public void ValidateHead404()
        {
            var methodInfo = typeof(HttpSuccessClient).GetMethod("Head404", Instance | Public);
            Assert.NotNull(methodInfo);
            Assert.AreEqual(typeof(Response<bool>), methodInfo.ReturnType);
        }
    }
}
