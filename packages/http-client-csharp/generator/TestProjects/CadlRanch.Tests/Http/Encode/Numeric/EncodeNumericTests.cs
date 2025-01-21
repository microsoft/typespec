// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Encode.Numeric;
using Encode.Numeric.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http.Encode.Numeric
{
    public class EncodeNumericTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Encode_Numeric_Property_safeintAsString() => Test(async (host) =>
        {
            var response = await new NumericClient(host, null).GetPropertyClient().SafeintAsStringAsync(new SafeintAsStringProperty(10000000000));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(10000000000, response.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Numeric_Property_uint32AsStringOptional() => Test(async (host) =>
        {
            var response = await new NumericClient(host, null).GetPropertyClient().Uint32AsStringOptionalAsync(new Uint32AsStringProperty()
            {
                Value = "1"
            });
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("1", response.Value.Value);
        });

        [CadlRanchTest]
        public Task Encode_Numeric_Property_uint8AsString() => Test(async (host) =>
        {
            var response = await new NumericClient(host, null).GetPropertyClient().Uint8AsStringAsync(new Uint8AsStringProperty(255));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(255, response.Value.Value);
        });
    }
}
