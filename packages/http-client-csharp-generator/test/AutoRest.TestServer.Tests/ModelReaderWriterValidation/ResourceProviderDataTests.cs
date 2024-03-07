// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using ModelReaderWriterValidationTypeSpec.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    internal class ResourceProviderDataTests : ModelJsonTests<ResourceProviderData>
    {
        protected override string JsonPayload => WirePayload;

        protected override string WirePayload => File.ReadAllText(TestData.GetLocation("ResourceProviderData/ResourceProviderData-Collapsed.json")).TrimEnd();

        protected override void CompareModels(ResourceProviderData model, ResourceProviderData model2, string format)
        {
            Assert.AreEqual(model.Id, model2.Id);
        }

        protected override string GetExpectedResult(string format) => WirePayload;

        protected override void VerifyModel(ResourceProviderData model, string format)
        {
            Assert.IsNotNull(model);
            Assert.IsNotNull(model.Id);
        }
    }
}
