// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.IO;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class RenamedModelTests : LocalModelJsonTests<RenamedModelCustom>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/RenamedModel/RenamedModel.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/RenamedModel/RenamedModelWireFormat.json"));
        protected override RenamedModelCustom ToModel(ClientResult result) => (RenamedModelCustom)result;
        protected override BinaryContent ToBinaryContent(RenamedModelCustom model) => model;

        protected override void CompareModels(RenamedModelCustom model, RenamedModelCustom model2, string format)
        {
#pragma warning disable CS0618 // This test intentionally uses a deprecated property.
            Assert.AreEqual(model.OtherName, model2.OtherName);
#pragma warning restore CS0618
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

        protected override void VerifyModel(RenamedModelCustom model, string format)
        {
#pragma warning disable CS0618 // This test intentionally uses a deprecated property.
            Assert.AreEqual("anotherName", model.OtherName);
#pragma warning restore CS0618
            Assert.AreEqual("projectedModel", model.Name);

            var rawData = GetRawData(model);
            Assert.IsNotNull(rawData);
            if (format == "J")
            {
                Assert.AreEqual("stuff", rawData["extra"].ToObjectFromJson<string>());
            }
        }
    }
}
