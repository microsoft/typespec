using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Azure.ResourceManager.Models;
using Azure.ResourceManager.Resources.Models;
using MgmtPropertyChooser;
using MgmtPropertyChooser.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtPropertyChooserTests : TestProjectTests
    {
        public MgmtPropertyChooserTests() : base("MgmtPropertyChooser") { }

        [TestCase]
        public void ValidateModelUsingUserIdentities()
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.Models.IdentityWithDifferentPropertyType");
            var properties = resourceOpreations.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            var userAssignedProperty = properties[3];
            Assert.NotNull(userAssignedProperty);
            Assert.AreEqual("UserAssignedIdentities", userAssignedProperty.Name);
            Assert.AreEqual(typeof(IDictionary<string, UserAssignedIdentity>), userAssignedProperty.PropertyType);

            var keyType = userAssignedProperty.PropertyType.GetGenericArguments()[0];
            Assert.AreEqual(typeof(string), keyType);
            var valueType = userAssignedProperty.PropertyType.GetGenericArguments()[1];
            Assert.AreEqual(typeof(UserAssignedIdentity), valueType);

            var valueProperties = valueType.GetProperties(BindingFlags.Public | BindingFlags.Instance);
            var principalIdProperty = valueProperties[0];
            Assert.NotNull(principalIdProperty);
            Assert.AreEqual("PrincipalId", principalIdProperty.Name);
            Assert.AreEqual(typeof(Guid), principalIdProperty.PropertyType.GetGenericArguments()[0]);

            var clientIdProperty = valueProperties[1];
            Assert.NotNull(clientIdProperty);
            Assert.AreEqual("ClientId", clientIdProperty.Name);
            Assert.AreEqual(typeof(Guid), clientIdProperty.PropertyType.GetGenericArguments()[0]);
        }

        [TestCase]
        public void ValidatePropertyReplacement()
        {
            var virtualMachineData = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.VirtualMachineData");
            var properties = virtualMachineData.GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            // Resource in the test swagger will be replaced by TrackedResource when used as the base class for inheritance,
            // but is not replaced when used as a property.
            Assert.AreEqual(virtualMachineData.BaseType, typeof(TrackedResourceData));
            Assert.AreEqual(properties.First(p => p.Name == "FakeResources").PropertyType.GetGenericArguments().First(), typeof(MgmtPropertyChooser.Models.MgmtPropertyChooserResourceData));
            // VirtualMachineIdentity is replaced by ManagedServiceIdentity, property name is unchanged, still called Identity.
            Assert.IsFalse(properties.Any(p => p.Name == "ManagedServiceIdentity"));
            Assert.IsTrue(properties.Any(p => p.Name == "Identity" && p.PropertyType == typeof(ManagedServiceIdentity)));
            // VirtualMachineIdentity is not generated
            var virtualMachineIdentityModel = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.Models.VirtualMachineIdentity");
            Assert.Null(virtualMachineIdentityModel);
            //IdentityV3 is replaced by ManagedServiceIdentity
            Assert.IsTrue(properties.Any(p => p.Name == "IdentityV3" && p.PropertyType == typeof(ManagedServiceIdentity)));
            // FakeSubResource is replaced by SubResource
            Assert.IsTrue(properties.Any(p => p.Name == "FakeSubResource" && p.PropertyType == typeof(SubResource)));
            // FakeWritableSubResource is replaced by WritableSubResource
            Assert.IsTrue(properties.Any(p => p.Name == "FakeWritableSubResource" && p.PropertyType == typeof(WritableSubResource)));
            // IdentityWithNoUserIdentity is replaced by ManagedServiceIdentity
            Assert.IsTrue(properties.Any(p => p.Name == "IdentityWithNoUserIdentity" && p.PropertyType == typeof(ManagedServiceIdentity)));
        }

        [TestCase]
        public void ValidateIdentityWithRenamedProperty()
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.Models.IdentityWithRenamedProperty");
            var properties = resourceOpreations.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            var principalIdProperty = properties[0];
            Assert.NotNull(principalIdProperty);
            Assert.AreEqual("TestPrincipalId", principalIdProperty.Name);
            Assert.AreEqual(typeof(string), principalIdProperty.PropertyType);

            var tenantIdProperty = properties[1];
            Assert.NotNull(tenantIdProperty);
            Assert.AreEqual("TenantId", tenantIdProperty.Name);
            Assert.AreEqual(typeof(string), tenantIdProperty.PropertyType);

            var userAssignedProperty = properties[3];
            Assert.NotNull(userAssignedProperty);
            Assert.AreEqual("UserAssignedIdentities", userAssignedProperty.Name);
            Assert.AreEqual(typeof(IDictionary<string, UserAssignedIdentity>), userAssignedProperty.PropertyType);
        }

        [TestCase]
        public void ValidateIdentityWithRenamedPropertyNotReplaced()
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.VirtualMachineData");
            var properties = resourceOpreations.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            Assert.IsTrue(properties.Any(p => p.Name == "IdentityWithRenamedProperty"));
            Assert.IsTrue(properties.Any(p => p.PropertyType == typeof(IdentityWithRenamedProperty)));
        }

        [TestCase]
        public void ValidateIdentityWithDifferentPropertyType()
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.Models.IdentityWithDifferentPropertyType");
            var properties = resourceOpreations.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            var principalIdProperty = properties[0];
            Assert.NotNull(principalIdProperty);
            Assert.AreEqual("PrincipalId", principalIdProperty.Name);
            Assert.AreEqual(typeof(string), principalIdProperty.PropertyType);

            var tenantIdProperty = properties[1];
            Assert.NotNull(tenantIdProperty);
            Assert.AreEqual("TenantId", tenantIdProperty.Name);
            Assert.AreEqual(typeof(int?), tenantIdProperty.PropertyType);

            var userAssignedProperty = properties[3];
            Assert.NotNull(userAssignedProperty);
            Assert.AreEqual("UserAssignedIdentities", userAssignedProperty.Name);
            Assert.AreEqual(typeof(IDictionary<string, UserAssignedIdentity>), userAssignedProperty.PropertyType);
        }

        [TestCase]
        public void ValidateIdentityWithDifferentPropertyTypeNotReplaced()
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.VirtualMachineData");
            var properties = resourceOpreations.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            Assert.IsTrue(properties.Any(p => p.Name == "IdentityWithDifferentPropertyType"));
            Assert.IsTrue(properties.Any(p => p.PropertyType == typeof(IdentityWithDifferentPropertyType)));
        }

        [TestCase]
        public void ValidateIdentityWithNoSystemIdentity()
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.Models.IdentityWithNoSystemIdentity");
            var properties = resourceOpreations.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            Assert.IsFalse(properties.Any(p => p.Name == "PrincipalId"));
            Assert.IsFalse(properties.Any(p => p.Name == "TenantId"));

            var userAssignedProperty = properties[1];
            Assert.NotNull(userAssignedProperty);
            Assert.AreEqual("UserAssignedIdentities", userAssignedProperty.Name);
            Assert.AreEqual(typeof(IDictionary<string, UserAssignedIdentity>), userAssignedProperty.PropertyType);
        }

        [TestCase]
        public void ValidateIdentityWithNoSystemIdentityNotReplaced()
        {
            var resourceOpreations = Assembly.GetExecutingAssembly().GetType("MgmtPropertyChooser.VirtualMachineData");
            var properties = resourceOpreations.GetProperties(BindingFlags.Public | BindingFlags.Instance);

            Assert.IsTrue(properties.Any(p => p.Name == "IdentityWithNoSystemIdentity"));
            Assert.IsTrue(properties.Any(p => p.PropertyType == typeof(IdentityWithNoSystemIdentity)));
        }
    }
}
