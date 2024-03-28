using System;
using System.Linq;
using NUnit.Framework;
using System.Collections.Generic;
using MgmtParent;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtParentTests : TestProjectTests
    {
        public MgmtParentTests()
            : base("MgmtParent")
        {
            TagResourceExceptions.Add(typeof(VirtualMachineExtensionImageResource));
        }

        protected override HashSet<Type> ListExceptionCollections { get; } = new HashSet<Type>() { typeof(DedicatedHostGroupCollection) };

        [TestCase("AvailabilitySetResource", true)]
        [TestCase("DedicatedHostGroupResource", true)]
        [TestCase("DedicatedHostResource", true)]
        [TestCase("VirtualMachineExtensionImageResource", true)]
        public void ValidateResources(string resource, bool isExists)
        {
            var resourceTypeExists = FindAllResources().Any(o => o.Name == resource);
            Assert.AreEqual(isExists, resourceTypeExists);
        }

        [TestCase("AvailabilitySetCollection", true)]
        [TestCase("DedicatedHostGroupCollection", true)]
        [TestCase("DedicatedHostCollection", true)]
        [TestCase("VirtualMachineExtensionImageCollection", true)]
        public void ValidateCollections(string collection, bool isExists)
        {
            var collectionTypeExists = FindAllCollections().Any(o => o.Name == collection);
            Assert.AreEqual(isExists, collectionTypeExists);
        }

        //[TestCase("AvailabilitySetCollection", "GetAllAsGenericResources", true)]
        //[TestCase("DedicatedHostGroupCollection", "GetAllAsGenericResources", true)]
        //public void ValidateMethods(string className, string methodName, bool exist)
        //{
        //    var classesToCheck = FindAllCollections();
        //    var classToCheck = classesToCheck.First(t => t.Name == className);
        //    Assert.AreEqual(exist, classToCheck.GetMethod(methodName) != null, $"can{(exist ? "not" : string.Empty)} find {className}.{methodName}");
        //}
    }
}
