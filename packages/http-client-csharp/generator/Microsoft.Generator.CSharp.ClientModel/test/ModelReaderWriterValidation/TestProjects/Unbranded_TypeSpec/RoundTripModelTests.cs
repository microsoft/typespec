// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.IO;
using System.Text.Json;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation.TestProjects.Unbranded_TypeSpec
{
    internal class RoundTripModelTests : LocalModelJsonTests<RoundTripModel>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/RoundTripModel/RoundTripModel.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/RoundTripModel/RoundTripModelWireFormat.json"));
        protected override RoundTripModel ToModel(ClientResult result) => (RoundTripModel)result;
        protected override BinaryContent ToBinaryContent(RoundTripModel model) => model;

        protected override void CompareModels(RoundTripModel model, RoundTripModel model2, string format)
        {
            Assert.AreEqual(model.RequiredString, model2.RequiredString);
            Assert.AreEqual(model.RequiredCollection, model2.RequiredCollection);
            Assert.AreEqual(model.RequiredDictionary, model2.RequiredDictionary);
            Assert.AreEqual(model.RequiredInt, model2.RequiredInt);
            // compare the RequiredModel
            var m1RequiredModel = model.RequiredModel;
            var m2RequiredModel = model2.RequiredModel;
            Assert.AreEqual(m1RequiredModel.Name, m2RequiredModel.Name);
            Assert.AreEqual(m1RequiredModel.RequiredUnion.ToString(), m2RequiredModel.RequiredUnion.ToString());
            Assert.AreEqual(m1RequiredModel.RequiredBadDescription, m2RequiredModel.RequiredBadDescription);
            Assert.AreEqual(m1RequiredModel.RequiredNullableList, m2RequiredModel.RequiredNullableList);

            Assert.AreEqual(model.IntExtensibleEnum, model2.IntExtensibleEnum);
            Assert.AreEqual(model.IntExtensibleEnumCollection, model2.IntExtensibleEnumCollection);
            Assert.AreEqual(model.FloatExtensibleEnum, model2.FloatExtensibleEnum);
            Assert.AreEqual(model.FloatExtensibleEnumCollection, model2.FloatExtensibleEnumCollection);
            Assert.AreEqual(model.FloatExtensibleEnumWithIntValue, model2.FloatExtensibleEnumWithIntValue);
            Assert.AreEqual(model.FloatFixedEnum, model2.FloatFixedEnum);
            Assert.AreEqual(model.FloatFixedEnumCollection, model2.FloatFixedEnumCollection);
            Assert.AreEqual(model.FloatFixedEnumWithIntValue, model2.FloatFixedEnumWithIntValue);
            Assert.AreEqual(model.IntFixedEnum, model2.IntFixedEnum);
            Assert.AreEqual(model.IntFixedEnumCollection, model2.IntFixedEnumCollection);
            Assert.AreEqual(model.StringFixedEnum, model2.StringFixedEnum);
            Assert.AreEqual(model.RequiredUnknown.ToString(), model2.RequiredUnknown.ToString());
            Assert.AreEqual(model.OptionalUnknown, model2.OptionalUnknown);
            // compare the RequiredRecord
            var m1RequiredRecord = model.RequiredRecordUnknown;
            var m2RequiredRecord = model2.RequiredRecordUnknown;

            foreach (var key in m1RequiredRecord.Keys)
            {
                Assert.IsTrue(m2RequiredRecord.ContainsKey(key));
                Assert.AreEqual(m1RequiredRecord[key].ToString(), m2RequiredRecord[key].ToString());
            }

            // compare the OptionalRecord
            var m1OptionalRecord = model.OptionalRecordUnknown;
            var m2OptionalRecord = model2.OptionalRecordUnknown;

            foreach (var key in m1OptionalRecord.Keys)
            {
                Assert.IsTrue(m2OptionalRecord.ContainsKey(key));
                Assert.AreEqual(m1OptionalRecord[key].ToString(), m2OptionalRecord[key].ToString());
            }

            // compare the ModelWithRequiredNullableProperties
            var m1ModelWithRequiredNullableProperties = model.ModelWithRequiredNullable;
            var m2ModelWithRequiredNullableProperties = model2.ModelWithRequiredNullable;
            Assert.AreEqual(m1ModelWithRequiredNullableProperties.RequiredNullablePrimitive, m2ModelWithRequiredNullableProperties.RequiredNullablePrimitive);
            Assert.AreEqual(m1ModelWithRequiredNullableProperties.RequiredExtensibleEnum.ToString(), m2ModelWithRequiredNullableProperties.RequiredExtensibleEnum.ToString());
            Assert.AreEqual(m1ModelWithRequiredNullableProperties.RequiredFixedEnum.ToString(), m2ModelWithRequiredNullableProperties.RequiredFixedEnum.ToString());

            Assert.AreEqual(model.RequiredBytes.ToString(), model2.RequiredBytes.ToString());


            if (format == "J")
            {
                // compare the ReadOnlyRequiredRecord
                var m1ReadOnlyRequiredRecord = model.ReadOnlyRequiredRecordUnknown;
                var m2ReadOnlyRequiredRecord = model2.ReadOnlyRequiredRecordUnknown;

                foreach (var key in m1ReadOnlyRequiredRecord.Keys)
                {
                    Assert.IsTrue(m2ReadOnlyRequiredRecord.ContainsKey(key));
                    Assert.AreEqual(m1ReadOnlyRequiredRecord[key].ToString(), m2ReadOnlyRequiredRecord[key].ToString());
                }

                var rawData = GetRawData(model);
                var rawData2 = GetRawData(model2);
                Assert.IsNotNull(rawData);
                Assert.IsNotNull(rawData2);
                Assert.AreEqual(rawData.Count, rawData2.Count);
                Assert.AreEqual(rawData["extra"].ToObjectFromJson<string>(), rawData2["extra"].ToObjectFromJson<string>());
            }
        }

        protected override void VerifyModel(RoundTripModel model, string format)
        {
            var parsedWireJson = JsonDocument.Parse(WirePayload).RootElement;
            Assert.IsNotNull(parsedWireJson);

            Assert.AreEqual(parsedWireJson.GetProperty("requiredString").GetString(), model.RequiredString);
            Assert.AreEqual(int.Parse(parsedWireJson.GetProperty("requiredInt").GetString()!), model.RequiredInt);
            Assert.AreEqual(1, model.RequiredCollection.Count);
            Assert.AreEqual(new IntExtensibleEnum(1), model.IntExtensibleEnum);
            Assert.AreEqual(2, model.IntExtensibleEnumCollection.Count);
            Assert.AreEqual(new FloatExtensibleEnum(1.1F), model.FloatExtensibleEnum);
            Assert.AreEqual(new FloatExtensibleEnumWithIntValue(1), model.FloatExtensibleEnumWithIntValue);
            Assert.AreEqual(2, model.FloatExtensibleEnumCollection.Count);
            Assert.AreEqual(2, model.FloatFixedEnumCollection.Count);
            Assert.AreEqual(FloatFixedEnum.OneDotOne, model.FloatFixedEnum);
            Assert.AreEqual(FloatFixedEnumWithIntValue.One, model.FloatFixedEnumWithIntValue);
            Assert.AreEqual(IntFixedEnum.One, model.IntFixedEnum);
            Assert.AreEqual(2, model.IntFixedEnumCollection.Count);
            Assert.AreEqual(StringFixedEnum.One, model.StringFixedEnum);
            Assert.AreEqual("\"foo\"", model.RequiredUnknown.ToString());

            var requiredRecord = model.RequiredRecordUnknown;
            Assert.AreEqual(2, requiredRecord.Count);
            Assert.AreEqual("\"foo\"", requiredRecord["recordKey1"].ToString());
            Assert.AreEqual("\"bar\"", requiredRecord["recordKey2"].ToString());

            var optionalRecord = model.OptionalRecordUnknown;
            Assert.AreEqual(2, optionalRecord.Count);
            Assert.AreEqual("\"foo\"", optionalRecord["recordKey1"].ToString());
            Assert.AreEqual("\"bar\"", optionalRecord["recordKey2"].ToString());

            var modelWithRequiredNullable = model.ModelWithRequiredNullable;
            Assert.IsNull(modelWithRequiredNullable.RequiredNullablePrimitive);
            Assert.AreEqual(new StringExtensibleEnum("Non-null value"), modelWithRequiredNullable.RequiredExtensibleEnum);
            Assert.AreEqual(StringFixedEnum.One, modelWithRequiredNullable.RequiredFixedEnum);

            Assert.AreEqual(new StringExtensibleEnum("EnumValue1"), model.RequiredDictionary["key1"]);
            Assert.AreEqual(new StringExtensibleEnum("EnumValue2"), model.RequiredDictionary["key2"]);
            var requiredModel = model.RequiredModel;
            Assert.AreEqual("Example Thing", requiredModel.Name);
            Assert.AreEqual("\"mockUnion\"", requiredModel.RequiredUnion.ToString());
            Assert.AreEqual("This is a description with potentially problematic characters like < or >.", requiredModel.RequiredBadDescription);
            Assert.AreEqual(3, requiredModel.RequiredNullableList.Count);

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
