// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using Encode.Boolean;
using Encode.Boolean._Property;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.Encode.Boolean
{
    public class EncodeBooleanTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Encode_Boolean_Property_trueLower() => Test(async (host) =>
        {
            var response = await new BooleanClient(host, null).GetPropertyClient().TrueLowerAsync(new BoolAsStringProperty(true));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsTrue(response.Value.Value);
        });

        [SpectorTest]
        public Task Encode_Boolean_Property_falseLower() => Test(async (host) =>
        {
            var response = await new BooleanClient(host, null).GetPropertyClient().FalseLowerAsync(new BoolAsStringProperty(false));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsFalse(response.Value.Value);
        });

        [SpectorTest]
        public Task Encode_Boolean_Property_trueUpper() => Test(async (host) =>
        {
            var response = await new BooleanClient(host, null).GetPropertyClient().TrueUpperAsync(new BoolAsStringProperty(true));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsTrue(response.Value.Value);
        });

        [SpectorTest]
        public Task Encode_Boolean_Property_falseMixed() => Test(async (host) =>
        {
            var response = await new BooleanClient(host, null).GetPropertyClient().FalseMixedAsync(new BoolAsStringProperty(false));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsFalse(response.Value.Value);
        });

        [SpectorTest]
        public void InvalidBooleanEncoding()
        {
            Assert.Throws<FormatException>(() => ModelReaderWriter.Read<BoolAsStringProperty>(
                BinaryData.FromString("{\"value\":\"not-a-boolean\"}")));
            Assert.Throws<InvalidOperationException>(() => ModelReaderWriter.Read<BoolAsStringProperty>(
                BinaryData.FromString("{\"value\":true}")));
        }
    }
}
