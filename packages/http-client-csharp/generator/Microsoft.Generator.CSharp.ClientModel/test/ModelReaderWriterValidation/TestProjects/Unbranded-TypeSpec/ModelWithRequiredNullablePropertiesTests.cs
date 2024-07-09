// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Text.Json;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation
{
    internal class ModelWithRequiredNullablePropertiesTests : ModelJsonTests<ModelWithRequiredNullableProperties>
    {
        protected override string JsonPayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/ModelWithRequiredNullable/Model.json"));
        protected override string WirePayload => File.ReadAllText(TestData.GetLocation("Unbranded-TypeSpec/TestData/ModelWithRequiredNullable/ModelWireFormat.json"));

        protected override void CompareModels(ModelWithRequiredNullableProperties model, ModelWithRequiredNullableProperties model2, string format)
        {
            Assert.AreEqual(model.RequiredNullablePrimitive, model2.RequiredNullablePrimitive);
            Assert.AreEqual(model.RequiredExtensibleEnum.ToString(), model2.RequiredExtensibleEnum.ToString());
            Assert.AreEqual(model.RequiredFixedEnum.ToString(), model2.RequiredFixedEnum.ToString());

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

        protected override void VerifyModel(ModelWithRequiredNullableProperties model, string format)
        {
            var parsedWireJson = JsonDocument.Parse(WirePayload).RootElement;
            Assert.IsNotNull(parsedWireJson);
            Assert.AreEqual(parsedWireJson.GetProperty("requiredNullablePrimitive").GetInt32(), model.RequiredNullablePrimitive);
            var requiredExtensibleEnumValue = parsedWireJson.GetProperty("requiredExtensibleEnum").GetString();
            Assert.AreEqual(new StringExtensibleEnum(requiredExtensibleEnumValue), model.RequiredExtensibleEnum);
            Assert.AreEqual(StringFixedEnum.One, model.RequiredFixedEnum);

            var rawData = GetRawData(model);
            Assert.IsNotNull(rawData);
            if (format == "J")
            {
                var parsedJson = JsonDocument.Parse(JsonPayload).RootElement;
                Assert.AreEqual(parsedJson.GetProperty("extra").GetString(), rawData["extra"].ToObjectFromJson<string>());
            }
        }
    }
}
