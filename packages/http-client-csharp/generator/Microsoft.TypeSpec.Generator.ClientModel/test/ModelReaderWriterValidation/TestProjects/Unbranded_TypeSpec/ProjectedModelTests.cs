// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.IO;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using UnbrandedTypeSpec.Models.Custom;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Unbranded_TypeSpec
{
    internal class ProjectedModelTests : LocalModelJsonTests<ProjectedModelCustom>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/ProjectedModel/ProjectedModel.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/ProjectedModel/ProjectedModelWireFormat.json"));
        protected override ProjectedModelCustom ToModel(ClientResult result) => (ProjectedModelCustom)result;
        protected override BinaryContent ToBinaryContent(ProjectedModelCustom model) => model;

        protected override void CompareModels(ProjectedModelCustom model, ProjectedModelCustom model2, string format)
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

        protected override void VerifyModel(ProjectedModelCustom model, string format)
        {
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
