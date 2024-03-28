// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Reflection;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtResourceNameTests : TestProjectTests
    {
        public MgmtResourceNameTests() : base("MgmtResourceName") { }

        [TestCase("MachineResource", true)]
        [TestCase("Disk", true)]
        [TestCase("Memory", true)]
        [TestCase("NetworkResource", true)]
        [TestCase("DisplayResource", true)]
        [TestCase("Machine", false)]
        [TestCase("DiskResource", false)]
        [TestCase("MemoryResource", false)]
        [TestCase("Network", false)]
        [TestCase("Display", false)]
        [TestCase("MachineResourceResource", false)]
        [TestCase("DiskResourceResource", false)]
        [TestCase("MemoryResourceResource", false)]
        [TestCase("NetworkResourceResource", false)]
        [TestCase("DisplayResourceResource", false)]
        public void ValidateResources(string resource, bool isExists)
        {
            var resourceTypeExists = FindAllResources().Any(o => o.Name == resource);
            Assert.AreEqual(isExists, resourceTypeExists);
        }

        [Test]
        public void ValidateResourceMethods([Values("MachineResource", "Disk", "Memory", "NetworkResource", "DisplayResource")]string resourceName,
            [Values("Get", "GetAsync")]string methodName)
        {
            var resource = FindAllResources().FirstOrDefault(r => r.Name == resourceName);
            Assert.IsNotNull(resource, $"Cannot find resource {resourceName}");
            var method = resource.GetMethod(methodName);
            Assert.IsNotNull(method);
        }

        [TestCase("MachineData", true)]
        [TestCase("DiskData", true)]
        [TestCase("MemoryData", true)]
        [TestCase("NetworkData", true)]
        [TestCase("DisplayResourceData", true)]
        [TestCase("Machine", false)]
        [TestCase("Disk", false)]
        [TestCase("Memory", false)]
        [TestCase("Network", false)]
        [TestCase("Display", false)]
        [TestCase("MachineResourceData", false)]
        [TestCase("DiskResourceData", false)]
        [TestCase("MemoryResourceData", false)]
        [TestCase("NetworkResourceData", false)]
        [TestCase("DisplayData", false)]
        public void ValidateResourceData(string resourceData, bool isExists)
        {
            var resourceTypeExists = FindAllResourceData().Any(o => o.Name == resourceData);
            Assert.AreEqual(isExists, resourceTypeExists);
        }

        [TestCase("MachineCollection", true)]
        [TestCase("DiskCollection", true)]
        [TestCase("MemoryCollection", true)]
        [TestCase("NetworkCollection", true)]
        [TestCase("DisplayResourceCollection", true)]
        [TestCase("MachineResourceCollection", false)]
        [TestCase("DiskResourceCollection", false)]
        [TestCase("MemoryResourceCollection", false)]
        [TestCase("NetworkResourceCollection", false)]
        [TestCase("DisplayCollection", false)]
        public void ValidateCollections(string collectionName, bool isExists)
        {
            var collectionTypeExists = FindAllCollections().Any(o => o.Name == collectionName);
            Assert.AreEqual(isExists, collectionTypeExists);
        }

        public void ValidateCollectionMethods([Values("MachineCollection", "DiskCollection", "MemoryCollection", "NetworkCollection", "DisplayResourceCollection")]string collectionName,
            [Values("Get", "GetAsync", "CreateOrUpdate", "CreateOrUpdateAsync", "GetAll", "GetAllAsync", "Exists", "ExistsAsync", "GetIfExists", "GetIfExistsAsync")]string methodName)
        {
            var resourceCollection = FindAllCollections().FirstOrDefault(o => o.Name == collectionName);
            Assert.IsNotNull(resourceCollection, $"Cannot find resource collection {collectionName}");
            var method = resourceCollection.GetMethod(methodName);
            Assert.IsNotNull(method);
        }
    }
}
