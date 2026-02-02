// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.Threading.Tasks;
using Encode._Array;
using Encode._Array._Property;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.Encode.Array
{
    public class EncodeArrayTests : SpectorTestBase
    {
        [SpectorTest]
        public Task CommaDelimited() => Test(async (host) =>
        {
            var testData = new List<string> { "blue", "red", "green" };
            var body = new CommaDelimitedArrayProperty(testData);
            
            ClientResult<CommaDelimitedArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().CommaDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task SpaceDelimited() => Test(async (host) =>
        {
            var testData = new List<string> { "blue", "red", "green" };
            var body = new SpaceDelimitedArrayProperty(testData);
            
            ClientResult<SpaceDelimitedArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().SpaceDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task PipeDelimited() => Test(async (host) =>
        {
            var testData = new List<string> { "blue", "red", "green" };
            var body = new PipeDelimitedArrayProperty(testData);
            
            ClientResult<PipeDelimitedArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().PipeDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task NewlineDelimited() => Test(async (host) =>
        {
            var testData = new List<string> { "blue", "red", "green" };
            var body = new NewlineDelimitedArrayProperty(testData);
            
            ClientResult<NewlineDelimitedArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().NewlineDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });


    }
}
