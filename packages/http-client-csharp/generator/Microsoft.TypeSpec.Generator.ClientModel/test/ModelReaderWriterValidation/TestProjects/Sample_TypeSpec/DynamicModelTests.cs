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

            using var document = JsonDocument.Parse(json);
            Assert.That(GetRootPropertyCount(document.RootElement, "requiredNullableList"), Is.EqualTo(1));
            CollectionAssert.AreEqual(
                new[] { 1, 2 },
                document.RootElement.GetProperty("requiredNullableList").EnumerateArray().Select(item => item.GetInt32()).ToArray());
        }

        [Test]
        public void ModelReaderWriterWrite_DoesNotDuplicatePatchedRequiredRootModelCollection()
        {
            var model = SampleTypeSpecModelFactory.DynamicModel(
                name: "dynamic-model",
                foo: new AnotherDynamicModel("bar"));

#pragma warning disable SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            model.Patch.Set("$.listFoo"u8, """[{"bar":"patched"}]"""u8);
#pragma warning restore SCME0001 // Type is for evaluation purposes only and is subject to change or removal in future updates.

            var data = ModelReaderWriter.Write(model, ModelReaderWriterOptions.Json, SampleTypeSpecContext.Default);
            var json = data.ToString();

            using var document = JsonDocument.Parse(json);
            Assert.That(GetRootPropertyCount(document.RootElement, "listFoo"), Is.EqualTo(1));
            var listFoo = document.RootElement.GetProperty("listFoo");
            Assert.That(listFoo.GetArrayLength(), Is.EqualTo(1));
            Assert.That(listFoo[0].GetProperty("bar").GetString(), Is.EqualTo("patched"));
        }

        private static int GetRootPropertyCount(JsonElement root, string propertyName) => root.EnumerateObject().Count(property => property.NameEquals(propertyName));
    }
}
