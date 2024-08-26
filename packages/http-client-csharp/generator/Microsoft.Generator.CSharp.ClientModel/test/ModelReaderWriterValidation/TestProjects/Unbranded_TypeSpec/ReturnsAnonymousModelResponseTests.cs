// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.IO;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Unbranded_TypeSpec
{
    internal class ReturnsAnonymousModelResponseTests : LocalModelJsonTests<ReturnsAnonymousModelResponse>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/ReturnsAnonymousModelResp/Model.json"));
        protected override string WirePayload => "{}";
        protected override ReturnsAnonymousModelResponse ToModel(ClientResult result) => (ReturnsAnonymousModelResponse)result;
        protected override BinaryContent ToBinaryContent(ReturnsAnonymousModelResponse model) => model;

        protected override void CompareModels(ReturnsAnonymousModelResponse model, ReturnsAnonymousModelResponse model2, string format)
        {
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

        protected override void VerifyModel(ReturnsAnonymousModelResponse model, string format)
        {
            var rawData = GetRawData(model);
            Assert.IsNotNull(rawData);
            if (format == "J")
            {
                Assert.AreEqual("stuff", rawData["extra"].ToObjectFromJson<string>());
            }
        }
    }
}
