using System.Linq;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;
using MgmtParamOrdering;
using MgmtParamOrdering.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtParamOrderingTests : TestProjectTests
    {
        public MgmtParamOrderingTests() : base("MgmtParamOrdering")
        {
            TagResourceExceptions.Add(typeof(VirtualMachineExtensionImageResource));
        }

        [TestCase("AvailabilitySetResource", true)]
        [TestCase("DedicatedHostGroupResource", true)]
        [TestCase("DedicatedHostResource", true)]
        [TestCase("VirtualMachineExtensionImageResource", true)]
        public void ValidateResource(string operation, bool isExists)
        {
            var resourceTypeExists = FindAllResources().Any(o => o.Name == operation);
            Assert.AreEqual(isExists, resourceTypeExists);
        }

        [TestCase("DedicatedHostCollection", "CreateOrUpdate",  "hostName")]
        [TestCase("DedicatedHostCollection", "CreateOrUpdateAsync", "hostName")]
        [TestCase("DedicatedHostCollection", "Get", "hostName")]
        [TestCase("DedicatedHostCollection", "GetAsync", "hostName")]
        [TestCase("DedicatedHostCollection", "Exists", "hostName")]
        [TestCase("DedicatedHostCollection", "ExistsAsync", "hostName")]
        [TestCase("DedicatedHostGroupCollection", "CreateOrUpdate", "hostGroupName")]
        [TestCase("DedicatedHostGroupCollection", "CreateOrUpdateAsync", "hostGroupName")]
        [TestCase("DedicatedHostGroupCollection", "Get", "hostGroupName")]
        [TestCase("DedicatedHostGroupCollection", "GetAsync", "hostGroupName")]
        [TestCase("DedicatedHostGroupCollection", "Exists", "hostGroupName")]
        [TestCase("DedicatedHostGroupCollection", "ExistsAsync", "hostGroupName")]
        [TestCase("EnvironmentContainerResourceCollection", "CreateOrUpdate", "name")]
        [TestCase("EnvironmentContainerResourceCollection", "CreateOrUpdateAsync", "name")]
        [TestCase("EnvironmentContainerResourceCollection", "Get", "name")]
        [TestCase("EnvironmentContainerResourceCollection", "GetAsync", "name")]
        [TestCase("EnvironmentContainerResourceCollection", "Exists", "name")]
        [TestCase("EnvironmentContainerResourceCollection", "ExistsAsync", "name")]
        public void ValidateCollectionCorrectFirstParameter(string collectionName, string methodName, string parameterName)
        {
            var method = FindAllCollections().Single(o => o.Name == collectionName).GetMethod(methodName);
            var firstParamName = method?.GetParameters().First().Name;
            if (firstParamName.Equals(KnownParameters.WaitForCompletion.Name))
            {
                // LRO, get next one
                firstParamName = method?.GetParameters()[1].Name;
            }
            Assert.AreEqual(parameterName, firstParamName);
        }

        [Test]
        public void ValidateAzureLocationFormat()
        {
            var obj = typeof(LocationFormatObject);
            Assert.IsNotNull(obj);
            var stringProperty = obj.GetProperty("StringLocation");
            Assert.IsNotNull(stringProperty);
            Assert.AreEqual(typeof(string), stringProperty.PropertyType);
            var objProperty = obj.GetProperty("ObjectLocation");
            Assert.IsNotNull(objProperty);
            Assert.AreEqual(typeof(AzureLocation?), objProperty.PropertyType);
        }
    }
}
