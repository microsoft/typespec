using System;
using System.Linq;
using System.Reflection;
using MgmtAcronymMapping;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtAcronymMappingTests : TestProjectTests
    {
        public MgmtAcronymMappingTests()
            : base("MgmtAcronymMapping")
        {
            TagResourceExceptions.Add(typeof(VirtualMachineScaleSetRollingUpgradeResource));
        }

        [TestCase(true, "AutomaticOSUpgradePolicy")]
        [TestCase(false, "AutomaticOsUpgradePolicy")]
        [TestCase(true, "VmDiskType")]
        [TestCase(false, "VMDiskType")]
        [TestCase(true, "IPVersion")]
        [TestCase(false, "IpVersion")]
        [TestCase(true, "VirtualMachineScaleSetVmInstanceIds")]
        [TestCase(false, "VirtualMachineScaleSetVmInstanceIDs")]
        public void ValidateTypeName(bool exist, string name)
        {
            var type = FindTypeByName(name);
            Assert.AreEqual(exist, type != null, $"Type {name} should {(exist ? string.Empty : "not")} exist");
        }

        [TestCase(true, "OSProfile", "VirtualMachineData")]
        [TestCase(false, "OsProfile", "VirtualMachineData")]
        [TestCase(true, "EnableAutomaticOSUpgrade", "AutomaticOSUpgradePolicy")]
        [TestCase(false, "EnableAutomaticOsUpgrade", "AutomaticOSUpgradePolicy")]
        [TestCase(true, "OSType", "ImageOSDisk")]
        [TestCase(false, "OsType", "ImageOSDisk")]
        [TestCase(true, "OSState", "ImageOSDisk")]
        [TestCase(false, "OsState", "ImageOSDisk")]
        [TestCase(true, "IPTagType", "VirtualMachineScaleSetIPTag")]
        [TestCase(false, "IpTagType", "VirtualMachineScaleSetIPTag")]
        [TestCase(true, "ResourceType", "ImageData")]
        [TestCase(false, "Type", "ImageData")]
        [TestCase(true, "VirtualMachineExtensionHandlerInstanceViewType", "VirtualMachineExtensionHandlerInstanceView")]
        [TestCase(false, "InstanceViewType", "VirtualMachineExtensionHandlerInstanceView")]
        public void ValidatePropertyName(bool exist, string propertyName, string className)
        {
            var type = FindTypeByName(className);
            Assert.NotNull(type, $"Type {className} should exist");
            var property = type.GetProperty(propertyName);
            Assert.AreEqual(exist, property != null, $"Property {propertyName} should {(exist ? string.Empty : "not")} exist");
        }

        private Type? FindTypeByName(string name)
        {
            var allTypes = MyTypes();
            return allTypes.FirstOrDefault(t => t.Name == name);
        }
    }
}
