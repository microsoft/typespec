using System;
using System.Linq;
using MgmtExpandResourceTypes.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtExtensionResourceTests : TestProjectTests
    {
        public MgmtExtensionResourceTests() : base("MgmtExtensionResource") { }

        [TestCase("MgmtExtensionResourceExtensions", "GetManagementGroupPolicyDefinitions", true)]
        [TestCase("MgmtExtensionResourceExtensions", "GetSubscriptionPolicyDefinitions", true)]
        [TestCase("MgmtExtensionResourceExtensions", "GetPolicyDefinitions", false)]
        [TestCase("ManagementGroupPolicyDefinitionCollection", "CreateOrUpdate", true)]
        [TestCase("ManagementGroupPolicyDefinitionCollection", "Get", true)]
        [TestCase("ManagementGroupPolicyDefinitionCollection", "CreateOrUpdateAtManagementGroup", false)]
        [TestCase("ManagementGroupPolicyDefinitionCollection", "GetAtManagementGroup", false)]
        [TestCase("ManagementGroupPolicyDefinitionCollection", "GetBuiltIn", false)]
        [TestCase("ManagementGroupPolicyDefinitionResource", "Get", true)]
        [TestCase("ManagementGroupPolicyDefinitionResource", "GetAtManagementGroup", false)]
        [TestCase("ManagementGroupPolicyDefinitionResource", "GetBuiltIn", false)]
        [TestCase("ManagementGroupPolicyDefinitionResource", "Delete", true)]
        [TestCase("ManagementGroupPolicyDefinitionResource", "DeleteAtManagementGroup", false)]
        public void ValidateExtensionResourceMethods(string className, string methodName, bool exist)
        {
            var classesToCheck = FindAllCollections().Concat(FindAllResources()).Append(FindExtensionClass());
            var classToCheck = classesToCheck.First(t => t.Name == className);
            Assert.AreEqual(exist, classToCheck.GetMethod(methodName) != null, $"can{(exist ? "not" : string.Empty)} find {className}.{methodName}");
        }

        [TestCase(typeof(MachineType), new string[] { "One", "Two", "Four" }, new object[] { 1, 2, 4 })]
        [TestCase(typeof(StorageType), new string[] { "StandardLRS", "StandardZRS", "StandardGRS" }, new object[] { 1, 2, 3 })]
        [TestCase(typeof(MemoryType), new string[] { "Two", "Four", "_1" }, new object[] { 2L, 4L, -1L })]
        public void ValidateIntEnumValues(Type enumType, string[] expectedNames, object[] expectedValues)
        {
            var names = Enum.GetNames(enumType);
            Assert.AreEqual(expectedNames, names);

            for (int i = 0; i < expectedNames.Length; i++)
            {
                Assert.AreEqual(expectedValues[i], Convert.ChangeType(Enum.Parse(enumType, expectedNames[i]), Enum.GetUnderlyingType(enumType)));
            }
        }
    }
}
