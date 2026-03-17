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

        [SpectorTest]
        public Task EnumCommaDelimited() => Test(async (host) =>
        {
            var testData = new List<Colors> { Colors.Blue, Colors.Red, Colors.Green };
            var body = new CommaDelimitedEnumArrayProperty(testData);

            ClientResult<CommaDelimitedEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().EnumCommaDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task EnumSpaceDelimited() => Test(async (host) =>
        {
            var testData = new List<Colors> { Colors.Blue, Colors.Red, Colors.Green };
            var body = new SpaceDelimitedEnumArrayProperty(testData);

            ClientResult<SpaceDelimitedEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().EnumSpaceDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task EnumPipeDelimited() => Test(async (host) =>
        {
            var testData = new List<Colors> { Colors.Blue, Colors.Red, Colors.Green };
            var body = new PipeDelimitedEnumArrayProperty(testData);

            ClientResult<PipeDelimitedEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().EnumPipeDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task EnumNewlineDelimited() => Test(async (host) =>
        {
            var testData = new List<Colors> { Colors.Blue, Colors.Red, Colors.Green };
            var body = new NewlineDelimitedEnumArrayProperty(testData);

            ClientResult<NewlineDelimitedEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().EnumNewlineDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task ExtensibleEnumCommaDelimited() => Test(async (host) =>
        {
            var testData = new List<ColorsExtensibleEnum> { ColorsExtensibleEnum.Blue, ColorsExtensibleEnum.Red, ColorsExtensibleEnum.Green };
            var body = new CommaDelimitedExtensibleEnumArrayProperty(testData);

            ClientResult<CommaDelimitedExtensibleEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().ExtensibleEnumCommaDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task ExtensibleEnumSpaceDelimited() => Test(async (host) =>
        {
            var testData = new List<ColorsExtensibleEnum> { ColorsExtensibleEnum.Blue, ColorsExtensibleEnum.Red, ColorsExtensibleEnum.Green };
            var body = new SpaceDelimitedExtensibleEnumArrayProperty(testData);

            ClientResult<SpaceDelimitedExtensibleEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().ExtensibleEnumSpaceDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task ExtensibleEnumPipeDelimited() => Test(async (host) =>
        {
            var testData = new List<ColorsExtensibleEnum> { ColorsExtensibleEnum.Blue, ColorsExtensibleEnum.Red, ColorsExtensibleEnum.Green };
            var body = new PipeDelimitedExtensibleEnumArrayProperty(testData);

            ClientResult<PipeDelimitedExtensibleEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().ExtensibleEnumPipeDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });

        [SpectorTest]
        public Task ExtensibleEnumNewlineDelimited() => Test(async (host) =>
        {
            var testData = new List<ColorsExtensibleEnum> { ColorsExtensibleEnum.Blue, ColorsExtensibleEnum.Red, ColorsExtensibleEnum.Green };
            var body = new NewlineDelimitedExtensibleEnumArrayProperty(testData);

            ClientResult<NewlineDelimitedExtensibleEnumArrayProperty> result = await new ArrayClient(host, null).GetPropertyClient().ExtensibleEnumNewlineDelimitedAsync(body);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(testData, result.Value.Value);
        });
    }
}
