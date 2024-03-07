using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using System.Collections.Generic;
using System;
using System.Xml;
using _Type._Dictionary;
using _Type._Dictionary.Models;
using Azure;

namespace CadlRanchProjects.Tests
{
    public class TypeDictionaryTests : CadlRanchTestBase
    {
        [Test]
        public Task Dictionary_Int32Value_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetInt32ValueClient().GetInt32ValueAsync();
            Assert.AreEqual(1, response.Value["k1"]);
            Assert.AreEqual(2, response.Value["k2"]);
        });

        [Test]
        public Task Dictionary_Int32Value_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetInt32ValueClient().PutAsync(new Dictionary<string, int>()
            {
                {"k1", 1 },
                {"k2", 2 }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_Int64Value_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetInt64ValueClient().GetInt64ValueAsync();
            Assert.AreEqual(9007199254740991, response.Value["k1"]);
            Assert.AreEqual(-9007199254740991, response.Value["k2"]);
        });

        [Test]
        public Task Dictionary_Int64Value_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetInt64ValueClient().PutAsync(new Dictionary<string, long>()
            {
                {"k1", 9007199254740991 },
                {"k2", -9007199254740991 }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_BooleanValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetBooleanValueClient().GetBooleanValueAsync();
            Assert.AreEqual(true, response.Value["k1"]);
            Assert.AreEqual(false, response.Value["k2"]);
        });

        [Test]
        public Task Dictionary_BooleanValue_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetBooleanValueClient().PutAsync(new Dictionary<string, bool>()
            {
                {"k1", true },
                {"k2", false }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_StringValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetStringValueClient().GetStringValueAsync();
            Assert.AreEqual("hello", response.Value["k1"]);
            Assert.AreEqual("", response.Value["k2"]);
        });

        [Test]
        public Task Dictionary_StringValue_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetStringValueClient().PutAsync(new Dictionary<string, string>()
            {
                {"k1", "hello" },
                {"k2", "" }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_Float32Value_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetFloat32ValueClient().GetFloat32ValueAsync();
            Assert.AreEqual(43.125f, response.Value["k1"]);
        });

        [Test]
        public Task Dictionary_Float32Value_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetFloat32ValueClient().PutAsync(new Dictionary<string, float>()
            {
                {"k1", 43.125f }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_DatetimeValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetDatetimeValueClient().GetDatetimeValueAsync();
            Assert.AreEqual(DateTimeOffset.Parse("2022-08-26T18:38:00Z"), response.Value["k1"]);
        });

        [Test]
        public Task Dictionary_DatetimeValue_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetDatetimeValueClient().PutAsync(new Dictionary<string, DateTimeOffset>()
            {
                {"k1", DateTimeOffset.Parse("2022-08-26T18:38:00Z") }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_DurationValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetDurationValueClient().GetDurationValueAsync();
            Assert.AreEqual(XmlConvert.ToTimeSpan("P123DT22H14M12.011S"), response.Value["k1"]);
        });

        [Test]
        public Task Dictionary_DurationValue_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetDurationValueClient().PutAsync(new Dictionary<string, TimeSpan>()
            {
                {"k1", XmlConvert.ToTimeSpan("P123DT22H14M12.011S") }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_UnknownValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetUnknownValueClient().GetUnknownValueAsync();
            Assert.AreEqual(1, response.Value["k1"].ToObjectFromJson());
            Assert.AreEqual("hello", response.Value["k2"].ToObjectFromJson());
            Assert.AreEqual(null, response.Value["k3"]);
        });

        [Test]
        public Task Dictionary_UnknownValue_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetUnknownValueClient().PutAsync(new Dictionary<string, BinaryData>()
            {
                {"k1", new BinaryData(1) },
                {"k2", new BinaryData("\"hello\"") },
                {"k3", null }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_ModelValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetModelValueClient().GetModelValueAsync();
            Assert.AreEqual("hello", response.Value["k1"].Property);
            Assert.AreEqual("world", response.Value["k2"].Property);
        });

        [Test]
        public Task Dictionary_ModelValue_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetModelValueClient().PutAsync(new Dictionary<string, InnerModel>()
            {
                {"k1", new InnerModel("hello") },
                {"k2", new InnerModel("world") }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Dictionary_RecursiveModelValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetRecursiveModelValueClient().GetRecursiveModelValueAsync();
            Assert.AreEqual("hello", response.Value["k1"].Property);
            Assert.AreEqual(0, response.Value["k1"].Children.Count);
            Assert.AreEqual("world", response.Value["k2"].Property);
            Assert.AreEqual("inner world", response.Value["k2"].Children["k2.1"].Property);
        });

        [Test]
        public Task Dictionary_RecursiveModelValue_put() => Test(async (host) =>
        {
            var firstModel = new InnerModel("hello");
            firstModel.Children.Clear();
            var response = await new DictionaryClient(host, null).GetRecursiveModelValueClient().PutAsync(new Dictionary<string, InnerModel>()
            {
                ["k1"] = firstModel,
                ["k2"] = new InnerModel("world")
                {
                    Children =
                    {
                        ["k2.1"] = new InnerModel("inner world")
                    }
                }
            });
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Dictionary_NullableFloatValue_get() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetNullableFloatValueClient().GetNullableFloatValueAsync();
            Assert.AreEqual(1.2f, response.Value["k1"]);
            Assert.AreEqual(0.5f, response.Value["k2"]);
            Assert.AreEqual(null, response.Value["k3"]);
        });

        [Test]
        public Task Type_Dictionary_NullableFloatValue_put() => Test(async (host) =>
        {
            var response = await new DictionaryClient(host, null).GetNullableFloatValueClient().PutAsync(new Dictionary<string, float?>()
            {
                {"k1", 1.2f },
                {"k2", 0.5f },
                {"k3", null }
            });
            Assert.AreEqual(204, response.Status);
        });
    }
}
