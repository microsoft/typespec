// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.IO;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;
using Microsoft.Generator.CSharp.Tests.Common;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Unbranded_TypeSpec
{
    internal class FriendTests : LocalModelJsonTests<Friend>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/Friend/Friend.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/Friend/FriendWireFormat.json"));
        protected override Friend ToModel(ClientResult result) => (Friend)result;
        protected override BinaryContent ToBinaryContent(Friend model) => model;

        protected override void CompareModels(Friend model, Friend model2, string format)
        {
            Assert.AreEqual(model.Name, model2.Name);

            if (format == "J")
            {
                var rawData = GetRawData(model);
                var rawData2 = GetRawData(model2);
                Assert.IsNotNull(rawData);
                Assert.IsNotNull(rawData2);
                Assert.AreEqual(rawData.Count, rawData2.Count);
                Assert.AreEqual(rawData["extra"].ToObjectFromJson<string>(), rawData2["extra"].ToObjectFromJson<string>());
            }
        }

        protected override void VerifyModel(Friend model, string format)
        {
            Assert.AreEqual("friendModel", model.Name);

            var rawData = GetRawData(model);
            Assert.IsNotNull(rawData);
            if (format == "J")
            {
                Assert.AreEqual("stuff", rawData["extra"].ToObjectFromJson<string>());
            }
        }
    }
}
