using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using _Type.Property.AdditionalProperties;
using _Type.Property.AdditionalProperties.Models;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class TypePropertyAdditionalPropertiesTests : CadlRanchTestBase
    {
        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsFloat_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsFloatClient().GetExtendsFloatAsync();
            var value = response.Value;
            Assert.AreEqual(43.125f, value.Id);
            CollectionAssert.AreEquivalent(new Dictionary<string, float>
            {
                ["prop"] = 43.125f,
            }, value.AdditionalProperties);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsFloat_put() => Test(async (host) =>
        {
            var value = new ExtendsFloatAdditionalProperties(43.125f)
            {
                AdditionalProperties =
                {
                    ["prop"] = 43.125f
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsFloatClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsFloat_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetIsFloatClient().GetIsFloatAsync();
            var value = response.Value;
            Assert.AreEqual(43.125f, value.Id);
            CollectionAssert.AreEquivalent(new Dictionary<string, float>
            {
                ["prop"] = 43.125f,
            }, value.AdditionalProperties);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsFloat_put() => Test(async (host) =>
        {
            var value = new IsFloatAdditionalProperties(43.125f)
            {
                AdditionalProperties =
                {
                    ["prop"] = 43.125f
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetIsFloatClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsModel_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsModelClient().GetExtendsModelAsync();
            var value = response.Value;
            Assert.AreEqual(1, value.AdditionalProperties.Count);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop"));
            var model = value.AdditionalProperties["prop"];
            Assert.AreEqual("ok", model.State);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsModel_put() => Test(async (host) =>
        {
            var value = new ExtendsModelAdditionalProperties()
            {
                AdditionalProperties =
                {
                    ["prop"] = new ModelForRecord("ok")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsModelClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsModel_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetIsModelClient().GetIsModelAsync();
            var value = response.Value;
            Assert.AreEqual(1, value.AdditionalProperties.Count);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop"));
            var model = value.AdditionalProperties["prop"];
            Assert.AreEqual("ok", model.State);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsModel_put() => Test(async (host) =>
        {
            var value = new IsModelAdditionalProperties()
            {
                AdditionalProperties =
                {
                    ["prop"] = new ModelForRecord("ok")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetIsModelClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsModelArray_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsModelArrayClient().GetExtendsModelArrayAsync();
            var value = response.Value;
            Assert.AreEqual(1, value.AdditionalProperties.Count);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop"));
            var prop = value.AdditionalProperties["prop"];
            Assert.AreEqual(2, prop.Count);
            Assert.AreEqual("ok", prop[0].State);
            Assert.AreEqual("ok", prop[1].State);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsModelArray_put() => Test(async (host) =>
        {
            var value = new ExtendsModelArrayAdditionalProperties()
            {
                AdditionalProperties =
                {
                    ["prop"] = new[]
                    {
                        new ModelForRecord("ok"),
                        new ModelForRecord("ok")
                    }
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsModelArrayClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsModelArray_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetIsModelArrayClient().GetIsModelArrayAsync();
            var value = response.Value;
            Assert.AreEqual(1, value.AdditionalProperties.Count);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop"));
            var prop = value.AdditionalProperties["prop"];
            Assert.AreEqual(2, prop.Count);
            Assert.AreEqual("ok", prop[0].State);
            Assert.AreEqual("ok", prop[1].State);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsModelArray_put() => Test(async (host) =>
        {
            var value = new IsModelArrayAdditionalProperties()
            {
                AdditionalProperties =
                {
                    ["prop"] = new[]
                    {
                        new ModelForRecord("ok"),
                        new ModelForRecord("ok")
                    }
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetIsModelArrayClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsString_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsStringClient().GetExtendsStringAsync();
            var value = response.Value;
            Assert.AreEqual("ExtendsStringAdditionalProperties", value.Name);
            CollectionAssert.AreEquivalent(new Dictionary<string, string>
            {
                ["prop"] = "abc"
            }, value.AdditionalProperties);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsString_put() => Test(async (host) =>
        {
            var value = new ExtendsStringAdditionalProperties("ExtendsStringAdditionalProperties")
            {
                AdditionalProperties =
                {
                    ["prop"] = "abc"
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsStringClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsString_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetIsStringClient().GetIsStringAsync();
            var value = response.Value;
            Assert.AreEqual("IsStringAdditionalProperties", value.Name);
            CollectionAssert.AreEquivalent(new Dictionary<string, string>
            {
                ["prop"] = "abc"
            }, value.AdditionalProperties);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsString_put() => Test(async (host) =>
        {
            var value = new IsStringAdditionalProperties("IsStringAdditionalProperties")
            {
                AdditionalProperties =
                {
                    ["prop"] = "abc"
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetIsStringClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsUnknown_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsUnknownClient().GetExtendsUnknownAsync();
            var value = response.Value;
            Assert.AreEqual("ExtendsUnknownAdditionalProperties", value.Name);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop1"));
            Assert.AreEqual(32, value.AdditionalProperties["prop1"].ToObjectFromJson<int>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop2"));
            Assert.AreEqual(true, value.AdditionalProperties["prop2"].ToObjectFromJson<bool>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop3"));
            Assert.AreEqual("abc", value.AdditionalProperties["prop3"].ToObjectFromJson<string>());
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsUnknown_put() => Test(async (host) =>
        {
            var value = new ExtendsUnknownAdditionalProperties("ExtendsUnknownAdditionalProperties")
            {
                AdditionalProperties =
                {
                    ["prop1"] = BinaryData.FromObjectAsJson(32),
                    ["prop2"] = BinaryData.FromObjectAsJson(true),
                    ["prop3"] = BinaryData.FromObjectAsJson("abc")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsUnknownClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsUnknownDerived_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsUnknownDerivedClient().GetExtendsUnknownDerivedAsync();
            var value = response.Value;
            Assert.AreEqual("ExtendsUnknownAdditionalProperties", value.Name);
            Assert.AreEqual(314, value.Index);
            Assert.AreEqual(2.71828f, value.Age);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop1"));
            Assert.AreEqual(32, value.AdditionalProperties["prop1"].ToObjectFromJson<int>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop2"));
            Assert.AreEqual(true, value.AdditionalProperties["prop2"].ToObjectFromJson<bool>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop3"));
            Assert.AreEqual("abc", value.AdditionalProperties["prop3"].ToObjectFromJson<string>());
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsUnknownDerived_put() => Test(async (host) =>
        {
            var value = new ExtendsUnknownAdditionalPropertiesDerived("ExtendsUnknownAdditionalProperties", 314)
            {
                Age = 2.71828f,
                AdditionalProperties =
                {
                    ["prop1"] = BinaryData.FromObjectAsJson(32),
                    ["prop2"] = BinaryData.FromObjectAsJson(true),
                    ["prop3"] = BinaryData.FromObjectAsJson("abc")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsUnknownDerivedClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsUnknownDiscriminatedClient().GetExtendsUnknownDiscriminatedAsync();
            var value = response.Value;
            Assert.AreEqual("Derived", value.Name);
            Assert.AreEqual("derived", value.Kind);
            var derived = value as ExtendsUnknownAdditionalPropertiesDiscriminatedDerived;
            Assert.IsNotNull(derived);
            Assert.AreEqual(314, derived.Index);
            Assert.AreEqual(2.71828f, derived.Age);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop1"));
            Assert.AreEqual(32, value.AdditionalProperties["prop1"].ToObjectFromJson<int>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop2"));
            Assert.AreEqual(true, value.AdditionalProperties["prop2"].ToObjectFromJson<bool>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop3"));
            Assert.AreEqual("abc", value.AdditionalProperties["prop3"].ToObjectFromJson<string>());
        });

        [Test]
        public Task Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_put() => Test(async (host) =>
        {
            var value = new ExtendsUnknownAdditionalPropertiesDiscriminatedDerived("Derived", 314)
            {
                Age = 2.71828f,
                AdditionalProperties =
                {
                    ["prop1"] = BinaryData.FromObjectAsJson(32),
                    ["prop2"] = BinaryData.FromObjectAsJson(true),
                    ["prop3"] = BinaryData.FromObjectAsJson("abc")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetExtendsUnknownDiscriminatedClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsUnknown_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetIsUnknownClient().GetIsUnknownAsync();
            var value = response.Value;
            Assert.AreEqual("IsUnknownAdditionalProperties", value.Name);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop1"));
            Assert.AreEqual(32, value.AdditionalProperties["prop1"].ToObjectFromJson<int>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop2"));
            Assert.AreEqual(true, value.AdditionalProperties["prop2"].ToObjectFromJson<bool>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop3"));
            Assert.AreEqual("abc", value.AdditionalProperties["prop3"].ToObjectFromJson<string>());
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsUnknown_put() => Test(async (host) =>
        {
            var value = new IsUnknownAdditionalProperties("IsUnknownAdditionalProperties")
            {
                AdditionalProperties =
                {
                    ["prop1"] = BinaryData.FromObjectAsJson(32),
                    ["prop2"] = BinaryData.FromObjectAsJson(true),
                    ["prop3"] = BinaryData.FromObjectAsJson("abc")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetIsUnknownClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsUnknownDerived_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetIsUnknownDerivedClient().GetIsUnknownDerivedAsync();
            var value = response.Value;
            Assert.AreEqual("IsUnknownAdditionalProperties", value.Name);
            Assert.AreEqual(314, value.Index);
            Assert.AreEqual(2.71828f, value.Age);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop1"));
            Assert.AreEqual(32, value.AdditionalProperties["prop1"].ToObjectFromJson<int>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop2"));
            Assert.AreEqual(true, value.AdditionalProperties["prop2"].ToObjectFromJson<bool>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop3"));
            Assert.AreEqual("abc", value.AdditionalProperties["prop3"].ToObjectFromJson<string>());
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsUnknownDerived_put() => Test(async (host) =>
        {
            var value = new IsUnknownAdditionalPropertiesDerived("IsUnknownAdditionalProperties", 314)
            {
                Age = 2.71828f,
                AdditionalProperties =
                {
                    ["prop1"] = BinaryData.FromObjectAsJson(32),
                    ["prop2"] = BinaryData.FromObjectAsJson(true),
                    ["prop3"] = BinaryData.FromObjectAsJson("abc")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetIsUnknownDerivedClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsUnknownDiscriminated_get() => Test(async (host) =>
        {
            var response = await new AdditionalPropertiesClient(host, null).GetIsUnknownDiscriminatedClient().GetIsUnknownDiscriminatedAsync();
            var value = response.Value;
            Assert.AreEqual("Derived", value.Name);
            Assert.AreEqual("derived", value.Kind);
            var derived = value as IsUnknownAdditionalPropertiesDiscriminatedDerived;
            Assert.IsNotNull(derived);
            Assert.AreEqual(314, derived.Index);
            Assert.AreEqual(2.71828f, derived.Age);
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop1"));
            Assert.AreEqual(32, value.AdditionalProperties["prop1"].ToObjectFromJson<int>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop2"));
            Assert.AreEqual(true, value.AdditionalProperties["prop2"].ToObjectFromJson<bool>());
            Assert.IsTrue(value.AdditionalProperties.ContainsKey("prop3"));
            Assert.AreEqual("abc", value.AdditionalProperties["prop3"].ToObjectFromJson<string>());
        });

        [Test]
        public Task Type_Property_AdditionalProperties_IsUnknownDiscriminated_put() => Test(async (host) =>
        {
            var value = new IsUnknownAdditionalPropertiesDiscriminatedDerived("Derived", 314)
            {
                Age = 2.71828f,
                AdditionalProperties =
                {
                    ["prop1"] = BinaryData.FromObjectAsJson(32),
                    ["prop2"] = BinaryData.FromObjectAsJson(true),
                    ["prop3"] = BinaryData.FromObjectAsJson("abc")
                }
            };
            var response = await new AdditionalPropertiesClient(host, null).GetIsUnknownDiscriminatedClient().PutAsync(value);
            Assert.AreEqual(204, response.Status);
        });
    }
}
