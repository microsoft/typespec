// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.IO;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using SampleTypeSpec;

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class DynamicModelWithBaseTests : LocalModelJsonTests<DynamicModelWithBase>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/DynamicModelWithBase/DynamicModelWithBase.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/DynamicModelWithBase/DynamicModelWithBaseWireFormat.json"));
        protected override DynamicModelWithBase ToModel(ClientResult result) => (DynamicModelWithBase)result;
        protected override BinaryContent ToBinaryContent(DynamicModelWithBase model) => model;

        protected override void CompareModels(DynamicModelWithBase model, DynamicModelWithBase model2, string format)
        {
            // Compare base model properties
            Assert.AreEqual(model.Name, model2.Name);
            
            // Compare derived model properties
            Assert.AreEqual(model.Id, model2.Id);

            if (format == "J")
            {
                // For dynamic models, compare the Patch data
                var patch1 = model.Patch;
                var patch2 = model2.Patch;
                
                Assert.AreEqual(patch1.Contains("$.extraProperty"u8), patch2.Contains("$.extraProperty"u8));

                var value1 = patch1.GetString("$.extraProperty"u8);
                var value2 = patch2.GetString("$.extraProperty"u8);
                Assert.AreEqual(value1, value2);
            }
        }

        protected override void VerifyModel(DynamicModelWithBase model, string format)
        {
            // Verify base model property
            Assert.AreEqual("baseName", model.Name);
            
            // Verify derived model property
            Assert.AreEqual("dynamicId123", model.Id);

            if (format == "J")
            {
                // For dynamic models, we can verify the extra property via the Patch
                var patch = model.Patch;
                Assert.IsTrue(patch.Contains("$.extraProperty"u8));

                var result = patch.GetString("$.extraProperty"u8);
                Assert.AreEqual("extraValue", result);
            }
        }
    }
}

#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
