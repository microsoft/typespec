// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using ModelWithConverterUsage.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class ModelWithConverterUsageTests
    {
        [Test]
        public void SerializeModelClass()
        {
            var model = new ModelClass(EnumProperty.A)
            {
                StringProperty = "test_str",
                ObjProperty = new Product()
                {
                    ConstProperty = "str"
                }
            };

            var jsonAsString = JsonSerializer.Serialize(model);
            Assert.AreEqual("{\"String_Property\":\"test_str\",\"Enum_Property\":\"A\",\"Obj_Property\":{\"Const_Property\":\"str\"}}", jsonAsString);
        }

        [Test]
        public void DeserializeModelClass()
        {
            string jsonString = @"{""String_Property"": ""test_str"",""Enum_Property"": ""A"", ""Obj_Property"": {""Const_Property"": ""str""}}";

            ModelClass model = JsonSerializer.Deserialize<ModelClass>(jsonString);
            Assert.AreEqual("test_str", model.StringProperty);
            Assert.AreEqual(EnumProperty.A, model.EnumProperty);
            Assert.AreEqual("str", model.ObjProperty.ConstProperty);
        }

        [Test]
        public void SerializeModelStruct()
        {
            var model = new ModelStruct("test_str");

            var jsonAsString = JsonSerializer.Serialize(model);
            Assert.AreEqual("{\"Model_Property\":\"test_str\"}", jsonAsString);
        }

        [Test]
        public void DeserializeModelStruct()
        {
            string jsonString = @"{""Model_Property"": ""test_str""}";

            var model = JsonSerializer.Deserialize<ModelStruct>(jsonString);
            Assert.AreEqual("test_str", model.ModelProperty);
        }

        [Test]
        public void SerializeProductModel()
        {
            var model = new Product()
            {
                ConstProperty = "test_str"
            };

            var jsonAsString = JsonSerializer.Serialize(model);
            Assert.AreEqual("{\"ConstProperty\":\"test_str\"}", jsonAsString);
        }

        [Test]
        public void DeserializeProductModel()
        {
            string jsonString = @"{""ConstProperty"": ""test_str""}";

            var model = JsonSerializer.Deserialize<Product>(jsonString);
            Assert.AreEqual("test_str", model.ConstProperty);
        }

        [Test]
        public void SerializeInputModel()
        {
            var model = new InputModel()
            {
                InputModelProperty = "test_str",
            };

            var jsonAsString = JsonSerializer.Serialize(model);
            Assert.AreEqual("{\"Input_Model_Property\":\"test_str\"}", jsonAsString);
        }

        [Test]
        public void DeserializeInputModel()
        {
            string jsonString = @"{""Input_Model_Property"": ""test_str""}";
            var model = JsonSerializer.Deserialize<InputModel>(jsonString);
            Assert.AreEqual("test_str", model.InputModelProperty);
        }

        [Test]
        public void SerializeOutputModel()
        {
            var model = ModelWithConverterUsageModelFactory.OutputModel("test_str");
            var json = JsonSerializer.Serialize(model);
            Assert.AreEqual(@"{""Output_Model_Property"":""test_str""}", json);
        }

        [Test]
        public void DeserializeOutputModel()
        {
            string jsonString = @"{""Output_Model_Property"": ""test_str""}";

            var model = JsonSerializer.Deserialize<OutputModel>(jsonString);
            Assert.AreEqual("test_str", model.OutputModelProperty);
        }
    }
}
