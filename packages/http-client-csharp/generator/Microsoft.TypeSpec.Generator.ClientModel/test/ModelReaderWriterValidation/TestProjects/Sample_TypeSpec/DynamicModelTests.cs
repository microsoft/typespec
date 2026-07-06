// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using SampleTypeSpec;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Sample_TypeSpec
{
    internal class DynamicModelTests
    {
        [Test]
        public void ModelReaderWriterWrite_DoesNotDuplicatePatchedRequiredRootCollection()
        {
            var model = SampleTypeSpecModelFactory.DynamicModel(
                name: "dynamic-model",
                foo: new AnotherDynamicModel("bar"));

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            model.Patch.Set("$.requiredNullableList"u8, "[1,2]"u8);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            var data = ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default);
            var json = data.ToString();

            Assert.That(json.Split("\"requiredNullableList\"").Length - 1, Is.EqualTo(1));

            using var document = JsonDocument.Parse(json);
            CollectionAssert.AreEqual(
                new[] { 1, 2 },
                document.RootElement.GetProperty("requiredNullableList").EnumerateArray().Select(item => item.GetInt32()).ToArray());
        }
    }
}
