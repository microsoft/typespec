// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;
using System.Text.Json;

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

        protected override async Task TestBinaryContentCast(ProjectedModel model, ModelReaderWriterOptions options)
        {
            using BinaryContent binaryContent = model;

            Assert.IsNotNull(binaryContent);

            using MemoryStream stream = new MemoryStream();
            await binaryContent.WriteToAsync(stream, CancellationToken.None);
            BinaryData serializedContent = ((IPersistableModel<object>)model).Write(options);

            Assert.AreEqual(serializedContent.ToArray(), stream.ToArray());
        }

        public override void TestClientResultCast(string serializedResponse)
        {
            var responseWithBody = new MockPipelineResponse(200);
            responseWithBody.SetContent(serializedResponse);
            ClientResult result = ClientResult.FromResponse(responseWithBody);

            ProjectedModel model = (ProjectedModel)result;

            Assert.IsNotNull(model);
            Assert.AreEqual("projectedModel", model.Name);
        }
    }
}
