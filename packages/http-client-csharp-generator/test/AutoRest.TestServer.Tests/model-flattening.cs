// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using model_flattening;
using model_flattening.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class ModelFlatteningTests : TestServerTestBase
    {
        [Test]
        public Task GetModelFlattenArray() => Test(async (host, pipeline) =>
        {
            var result = await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).GetArrayAsync();
            var product1 = result.Value.ElementAt(0);
            Assert.AreEqual("1", product1.Id);
            Assert.AreEqual("Building 44", product1.Location);
            Assert.AreEqual("Resource1", product1.Name);
            Assert.AreEqual("Succeeded", product1.ProvisioningState);
            Assert.AreEqual(FlattenedProductPropertiesProvisioningStateValues.OK, product1.ProvisioningStateValues);
            Assert.AreEqual("Product1", product1.PName);
            Assert.AreEqual("Flat", product1.TypePropertiesType);
            Assert.AreEqual("value1", product1.Tags["tag1"]);
            Assert.AreEqual("value3", product1.Tags["tag2"]);
            Assert.AreEqual("Microsoft.Web/sites", product1.Type);
            var product2 = result.Value.ElementAt(1);
            Assert.AreEqual("2", product2.Id);
            Assert.AreEqual("Resource2", product2.Name);
            Assert.AreEqual("Building 44", product2.Location);
            var product3 = result.Value.ElementAt(2);
            Assert.AreEqual("3", product3.Id);
            Assert.AreEqual("Resource3", product3.Name);
        });

        [Test]
        public Task GetModelFlattenDictionary() => Test(async (host, pipeline) =>
        {
            var result = await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).GetDictionaryAsync();
            var product1 = result.Value["Product1"];
            Assert.AreEqual("1", product1.Id);
            Assert.AreEqual("Building 44", product1.Location);
            Assert.AreEqual("Resource1", product1.Name);
            Assert.AreEqual("Succeeded", product1.ProvisioningState);
            Assert.AreEqual(FlattenedProductPropertiesProvisioningStateValues.OK, product1.ProvisioningStateValues);
            Assert.AreEqual("Product1", product1.PName);
            Assert.AreEqual("Flat", product1.TypePropertiesType);
            Assert.AreEqual("value1", product1.Tags["tag1"]);
            Assert.AreEqual("value3", product1.Tags["tag2"]);
            Assert.AreEqual("Microsoft.Web/sites", product1.Type);
            var product2 = result.Value["Product2"];
            Assert.AreEqual("2", product2.Id);
            Assert.AreEqual("Resource2", product2.Name);
            Assert.AreEqual("Building 44", product2.Location);
            var product3 = result.Value["Product3"];
            Assert.AreEqual("3", product3.Id);
            Assert.AreEqual("Resource3", product3.Name);
        });

        [Test]
        public Task GetModelFlattenResourceCollection() => Test(async (host, pipeline) =>
        {
            var result = await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).GetResourceCollectionAsync();
            var product1 = result.Value.Dictionaryofresources["Product1"];
            Assert.AreEqual("1", product1.Id);
            Assert.AreEqual("Building 44", product1.Location);
            Assert.AreEqual("Resource1", product1.Name);
            Assert.AreEqual("Succeeded", product1.ProvisioningState);
            Assert.AreEqual(FlattenedProductPropertiesProvisioningStateValues.OK, product1.ProvisioningStateValues);
            Assert.AreEqual("Product1", product1.PName);
            Assert.AreEqual("Flat", product1.TypePropertiesType);
            Assert.AreEqual("value1", product1.Tags["tag1"]);
            Assert.AreEqual("value3", product1.Tags["tag2"]);
            Assert.AreEqual("Microsoft.Web/sites", product1.Type);
            var product2 = result.Value.Dictionaryofresources["Product2"];
            Assert.AreEqual("2", product2.Id);
            Assert.AreEqual("Resource2", product2.Name);
            Assert.AreEqual("Building 44", product2.Location);
            var product3 = result.Value.Dictionaryofresources["Product3"];
            Assert.AreEqual("3", product3.Id);
            Assert.AreEqual("Resource3", product3.Name);

            var product4 = result.Value.Arrayofresources.ElementAt(0);
            Assert.AreEqual("4", product4.Id);
            Assert.AreEqual("Building 44", product4.Location);
            Assert.AreEqual("Resource4", product4.Name);
            Assert.AreEqual("Succeeded", product4.ProvisioningState);
            Assert.AreEqual(FlattenedProductPropertiesProvisioningStateValues.OK, product4.ProvisioningStateValues);
            Assert.AreEqual("Product4", product4.PName);
            Assert.AreEqual("Flat", product4.TypePropertiesType);
            Assert.AreEqual("value1", product4.Tags["tag1"]);
            Assert.AreEqual("value3", product4.Tags["tag2"]);
            Assert.AreEqual("Microsoft.Web/sites", product4.Type);
            var product5 = result.Value.Arrayofresources.ElementAt(1);
            Assert.AreEqual("5", product5.Id);
            Assert.AreEqual("Resource5", product5.Name);
            Assert.AreEqual("Building 44", product5.Location);
            var product6 = result.Value.Arrayofresources.ElementAt(2);
            Assert.AreEqual("6", product6.Id);
            Assert.AreEqual("Resource6", product6.Name);

            var product7 = result.Value.Productresource;
            Assert.AreEqual("7", product7.Id);
            Assert.AreEqual("Resource7", product7.Name);
            Assert.AreEqual("Building 44", product7.Location);
        });

        [Test]
        public Task PostModelFlattenCustomParameter() => Test(async (host, pipeline) =>
        {
            var result = await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).PostFlattenedSimpleProductAsync(
                productId: "123",
                description: "product description",
                maxProductDisplayName: "max name",
                capacity: SimpleProductPropertiesMaxProductCapacity.Large,
                genericValue: null,
                odataValue: "http://foo");
            Assert.AreEqual("123", result.Value.ProductId);
            Assert.AreEqual("product description", result.Value.Description);
            Assert.AreEqual("max name", result.Value.MaxProductDisplayName);
            Assert.AreEqual(SimpleProductPropertiesMaxProductCapacity.Large, result.Value.Capacity);
            Assert.AreEqual("http://foo", result.Value.OdataValue);
        });

        [Test]
        public Task PutModelFlattenArray() => TestStatus(async (host, pipeline) =>
        {
            var value = new[]
            {
                new Resource
                {
                    Location = "West US",
                    Tags =
                    {
                        { "tag1", "value1" },
                        { "tag2", "value3" }
                    }
                },
                new Resource
                {
                    Location = "Building 44"
                }
            };
            return await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).PutArrayAsync(value);
        });

        [Test]
        public Task PutModelFlattenCustomBase() => Test(async (host, pipeline) =>
        {
            var value = new SimpleProduct("123")
            {
                Description = "product description",
                MaxProductDisplayName = "max name",
                Capacity = SimpleProductPropertiesMaxProductCapacity.Large,
                OdataValue = "http://foo",
                GenericValue = "https://generic"
            };
            var result = await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).PutSimpleProductAsync(value);
            Assert.AreEqual("123", result.Value.ProductId);
            Assert.AreEqual("product description", result.Value.Description);
            Assert.AreEqual("max name", result.Value.MaxProductDisplayName);
            Assert.AreEqual(SimpleProductPropertiesMaxProductCapacity.Large, result.Value.Capacity);
            Assert.AreEqual("http://foo", result.Value.OdataValue);
            Assert.AreEqual("https://generic", result.Value.GenericValue);
        });

        [Test]
        public Task PutModelFlattenCustomGroupedParameter() => Test(async (host, pipeline) =>
        {
            var result = await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).PutSimpleProductWithGroupingAsync(
                new FlattenParameterGroup("groupproduct", productId: "123")
                {
                    Description = "product description",
                    MaxProductDisplayName = "max name",
                    OdataValue = "http://foo",
                    Capacity = SimpleProductPropertiesMaxProductCapacity.Large
                });
            Assert.AreEqual("123", result.Value.ProductId);
            Assert.AreEqual("product description", result.Value.Description);
            Assert.AreEqual("max name", result.Value.MaxProductDisplayName);
            Assert.AreEqual(SimpleProductPropertiesMaxProductCapacity.Large, result.Value.Capacity);
            Assert.AreEqual("http://foo", result.Value.OdataValue);
        });

        [Test]
        public Task PutModelFlattenDictionary() => TestStatus(async (host, pipeline) =>
        {
            var value = new Dictionary<string, FlattenedProduct>
            {
                { "Resource1", new FlattenedProduct
                    {
                        Location = "West US",
                        Tags =
                        {
                            { "tag1", "value1" },
                            { "tag2", "value3" }
                        },
                        PName = "Product1",
                        TypePropertiesType = "Flat"
                    }
                },
                { "Resource2", new FlattenedProduct
                    {
                        Location = "Building 44",
                        PName = "Product2",
                        TypePropertiesType = "Flat"
                    }
                }
            };
            return await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).PutDictionaryAsync(value);
        });

        [Test]
        public Task PutModelFlattenResourceCollection() => TestStatus(async (host, pipeline) =>
        {
            var value = new ResourceCollection
            {
                Arrayofresources =
                {
                    new FlattenedProduct
                    {
                        Location = "West US",
                        Tags =
                        {
                            { "tag1", "value1" },
                            { "tag2", "value3" }
                        },
                        PName = "Product1",
                        TypePropertiesType = "Flat"
                    },
                    new FlattenedProduct
                    {
                        Location = "East US",
                        PName = "Product2",
                        TypePropertiesType = "Flat"
                    }
                },
                Dictionaryofresources =
                {
                    { "Resource1", new FlattenedProduct
                        {
                            Location = "West US",
                            Tags =
                            {
                                { "tag1", "value1" },
                                { "tag2", "value3" }
                            },
                            PName = "Product1",
                            TypePropertiesType = "Flat"
                        }
                    },
                    { "Resource2", new FlattenedProduct
                        {
                            Location = "Building 44",
                            PName = "Product2",
                            TypePropertiesType = "Flat"
                        }
                    }
                },
                Productresource = new FlattenedProduct
                {
                    Location = "India",
                    PName = "Azure",
                    TypePropertiesType = "Flat"
                }
            };
            return await new AutoRestResourceFlatteningTestServiceClient(ClientDiagnostics, pipeline, host).PutResourceCollectionAsync(value);
        });
    }
}
