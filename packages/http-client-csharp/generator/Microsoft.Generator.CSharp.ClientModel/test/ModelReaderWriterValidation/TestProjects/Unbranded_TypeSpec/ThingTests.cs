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
    internal class ThingTests : LocalModelJsonTests<Thing>
    {
        protected override string JsonPayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/Thing/Thing.json"));
        protected override string WirePayload => File.ReadAllText(ModelTestHelper.GetLocation("TestData/Thing/ThingWireFormat.json"));
        protected override Thing ToModel(ClientResult result) => (Thing)result;
        protected override BinaryContent ToBinaryContent(Thing model) => model;

        protected override void CompareModels(Thing model, Thing model2, string format)
        {
            Assert.AreEqual(model.Name, model2.Name);
            Assert.AreEqual(model.RequiredUnion.ToString(), model2.RequiredUnion.ToString());
            Assert.AreEqual(model.RequiredLiteralString, model2.RequiredLiteralString);
            Assert.AreEqual(model.RequiredLiteralInt, model2.RequiredLiteralInt);
            Assert.AreEqual(model.RequiredLiteralFloat, model2.RequiredLiteralFloat);
            Assert.AreEqual(model.RequiredLiteralBool, model2.RequiredLiteralBool);
            Assert.AreEqual(model.OptionalLiteralString, model2.OptionalLiteralString);
            Assert.AreEqual(model.OptionalLiteralInt, model2.OptionalLiteralInt);
            Assert.AreEqual(model.OptionalLiteralFloat, model2.OptionalLiteralFloat);
            Assert.AreEqual(model.OptionalLiteralBool, model2.OptionalLiteralBool);
            Assert.AreEqual(model.RequiredBadDescription, model2.RequiredBadDescription);
            Assert.AreEqual(model.OptionalNullableList, model2.OptionalNullableList);
            Assert.AreEqual(model.RequiredNullableList, model2.RequiredNullableList);

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

        protected override void VerifyModel(Thing model, string format)
        {
            var parsedWireJson = JsonDocument.Parse(WirePayload).RootElement;
            Assert.IsNotNull(parsedWireJson);
            Assert.AreEqual(parsedWireJson.GetProperty("name").GetString(), model.Name);
            Assert.AreEqual("\"mockUnion\"", model.RequiredUnion.ToString());
            Assert.AreEqual(parsedWireJson.GetProperty("requiredBadDescription").GetString(), model.RequiredBadDescription);
            Assert.AreEqual(parsedWireJson.GetProperty("requiredNullableList").GetArrayLength(), model.RequiredNullableList.Count);
            Assert.AreEqual(new ThingRequiredLiteralString(parsedWireJson.GetProperty("requiredLiteralString").GetString()), model.RequiredLiteralString);
            Assert.AreEqual(new ThingRequiredLiteralInt(parsedWireJson.GetProperty("requiredLiteralInt").GetInt32()), model.RequiredLiteralInt);
            Assert.AreEqual(new ThingRequiredLiteralFloat(parsedWireJson.GetProperty("requiredLiteralFloat").GetSingle()), model.RequiredLiteralFloat);
            Assert.AreEqual(parsedWireJson.GetProperty("requiredLiteralBool").GetBoolean(), model.RequiredLiteralBool);
            Assert.AreEqual(new ThingOptionalLiteralString(parsedWireJson.GetProperty("optionalLiteralString").GetString()), model.OptionalLiteralString);
            Assert.AreEqual(new ThingOptionalLiteralInt(parsedWireJson.GetProperty("optionalLiteralInt").GetInt32()), model.OptionalLiteralInt);
            Assert.AreEqual(new ThingOptionalLiteralFloat(parsedWireJson.GetProperty("optionalLiteralFloat").GetSingle()), model.OptionalLiteralFloat);
            Assert.AreEqual(parsedWireJson.GetProperty("optionalLiteralBool").GetBoolean(), model.OptionalLiteralBool);
            Assert.AreEqual(parsedWireJson.GetProperty("optionalNullableList").GetArrayLength(), model.OptionalNullableList.Count);


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
