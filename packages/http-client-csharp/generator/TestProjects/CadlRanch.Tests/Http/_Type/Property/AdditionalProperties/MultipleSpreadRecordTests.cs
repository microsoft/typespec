// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.IO;
using _Type.Property.AdditionalProperties.Models;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using TestProjects.CadlRanch.Tests.Infrastructure;

namespace TestProjects.CadlRanch.Tests.Http._Type.Property.AdditionalProperties
{
    internal class MultipleSpreadRecordTests : CadlRanchModelJsonTests<MultipleSpreadRecord>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/MultipleSpreadRecord/MultipleSpreadRecord.json"));

        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/MultipleSpreadRecord/MultipleSpreadRecordWire.json"));

        protected override void CompareModels(MultipleSpreadRecord model, MultipleSpreadRecord model2, string format)
        {
            Assert.AreEqual(model.Flag, model2.Flag);
            var modelAdditionalProperties = model.AdditionalProperties;
            var model2AdditionalProperties = model2.AdditionalProperties;
            Assert.AreEqual(modelAdditionalProperties.Count, model2AdditionalProperties.Count);
            foreach (var key in modelAdditionalProperties.Keys)
            {
                Assert.AreEqual(modelAdditionalProperties[key], model2AdditionalProperties[key]);
            }

            var modelAdditionalSingleProperties = model.AdditionalSingleProperties;
            var model2AdditionalSingleProperties = model2.AdditionalSingleProperties;
            Assert.AreEqual(modelAdditionalSingleProperties.Count, model2AdditionalSingleProperties.Count);
            foreach (var key in modelAdditionalSingleProperties.Keys)
            {
                Assert.AreEqual(modelAdditionalSingleProperties[key], model2AdditionalSingleProperties[key]);
            }
        }

        protected override BinaryContent ToBinaryContent(MultipleSpreadRecord model) => model;

        protected override MultipleSpreadRecord ToModel(ClientResult result) => (MultipleSpreadRecord)result;

        protected override void VerifyModel(MultipleSpreadRecord model, string format)
        {
            Assert.AreEqual(true, model.Flag);
            Assert.AreEqual(1, model.AdditionalProperties.Count);
            Assert.AreEqual("foo", model.AdditionalProperties["extra"]);
            Assert.AreEqual(1, model.AdditionalSingleProperties.Count);
            Assert.AreEqual(42.2F, model.AdditionalSingleProperties["extraFloat"]);
        }
    }
}
