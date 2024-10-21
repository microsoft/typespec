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
    internal class DifferentSpreadStringDerivedTests : CadlRanchModelJsonTests<DifferentSpreadStringDerived>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/DifferentSpreadStringDerived/Derived.json"));

        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/DifferentSpreadStringDerived/DerivedWire.json"));

        protected override void CompareModels(DifferentSpreadStringDerived model, DifferentSpreadStringDerived model2, string format)
        {
            Assert.AreEqual(model.Id, model2.Id);
            Assert.AreEqual(model.DerivedProp, model2.DerivedProp);
            var modelAdditionalProperties = model.AdditionalProperties;
            var model2AdditionalProperties = model2.AdditionalProperties;
            Assert.AreEqual(modelAdditionalProperties.Count, model2AdditionalProperties.Count);
            foreach (var key in modelAdditionalProperties.Keys)
            {
                Assert.AreEqual(modelAdditionalProperties[key], model2AdditionalProperties[key]);
            }
        }

        protected override BinaryContent ToBinaryContent(DifferentSpreadStringDerived model) => model;

        protected override DifferentSpreadStringDerived ToModel(ClientResult result) => (DifferentSpreadStringDerived)result;

        protected override void VerifyModel(DifferentSpreadStringDerived model, string format)
        {
            Assert.AreEqual(5.5, model.Id);
            Assert.AreEqual("derived value", model.DerivedProp);
            Assert.AreEqual(1, model.AdditionalProperties.Count);
            Assert.AreEqual("foo", model.AdditionalProperties["extra"]);
        }
    }
}
