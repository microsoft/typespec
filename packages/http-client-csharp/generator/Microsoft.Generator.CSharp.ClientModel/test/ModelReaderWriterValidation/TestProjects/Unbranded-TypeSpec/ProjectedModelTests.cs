// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation
{
    internal class ProjectedModelTests : ModelJsonTests<ProjectedModel>
    {
        protected override string JsonPayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/ProjectedModel/ProjectedModel.json"));
        protected override string WirePayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/ProjectedModel/ProjectedModelWireFormat.json"));

        protected override void CompareModels(ProjectedModel model, ProjectedModel model2, string format)
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

        protected override void VerifyModel(ProjectedModel model, string format)
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
