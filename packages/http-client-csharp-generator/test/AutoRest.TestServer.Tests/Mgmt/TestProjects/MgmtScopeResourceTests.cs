using System.Linq;
using System.Reflection;
using NUnit.Framework;
using System.Collections.Generic;
using MgmtScopeResource;
using System;
using MgmtScopeResource.Models;
using Azure.ResourceManager;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtScopeResourceTests : TestProjectTests
    {
        public MgmtScopeResourceTests() : base("MgmtScopeResource") { }

        protected override HashSet<Type> ListExceptionCollections { get; } = new HashSet<Type>() { typeof(ResourceLinkCollection) };

        [TestCase("MgmtScopeResourceExtensions", "GetFakePolicyAssignments", false, typeof(Azure.ResourceManager.Resources.TenantResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetFakePolicyAssignments", false, typeof(Azure.ResourceManager.Resources.SubscriptionResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetFakePolicyAssignments", false, typeof(Azure.ResourceManager.Resources.ResourceGroupResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetFakePolicyAssignments", false, typeof(Azure.ResourceManager.ManagementGroups.ManagementGroupResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetFakePolicyAssignments", true, typeof(ArmResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetDeploymentExtendeds", true, typeof(Azure.ResourceManager.Resources.TenantResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetDeploymentExtendeds", true, typeof(Azure.ResourceManager.Resources.SubscriptionResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetDeploymentExtendeds", true, typeof(Azure.ResourceManager.Resources.ResourceGroupResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetDeploymentExtendeds", true, typeof(Azure.ResourceManager.ManagementGroups.ManagementGroupResource))]
        [TestCase("MgmtScopeResourceExtensions", "GetDeploymentExtendeds", false, typeof(ArmResource))]
        [TestCase("FakePolicyAssignmentCollection", "CreateOrUpdate", true)]
        [TestCase("FakePolicyAssignmentCollection", "Get", true)]
        [TestCase("FakePolicyAssignmentCollection", "GetAll", true)]
        [TestCase("FakePolicyAssignmentCollection", "GetForResourceGroup", false)]
        [TestCase("FakePolicyAssignmentCollection", "GetForResource", false)]
        [TestCase("FakePolicyAssignmentCollection", "GetForManagementGroup", false)]
        [TestCase("FakePolicyAssignmentCollection", "GetAllAsGenericResources", false)]
        [TestCase("FakePolicyAssignmentResource", "Get", true)]
        [TestCase("FakePolicyAssignmentResource", "Delete", true)]
        [TestCase("DeploymentExtendedCollection", "CreateOrUpdate", true)]
        [TestCase("DeploymentExtendedCollection", "Get", true)]
        [TestCase("DeploymentExtendedCollection", "GetAll", true)]
        [TestCase("DeploymentExtendedCollection", "GetAllAsGenericResources", false)]
        [TestCase("DeploymentExtendedResource", "WhatIf", true)]
        [TestCase("DeploymentExtendedResource", "WhatIfAtTenantScope", false)]
        [TestCase("DeploymentExtendedResource", "WhatIfAtSubscriptionScope", false)]
        [TestCase("DeploymentExtendedResource", "WhatIfAtManagementGroupScope", false)]
        [TestCase("ResourceLinkCollection", "CreateOrUpdate", true)]
        [TestCase("ResourceLinkCollection", "Get", true)]
        //[TestCase("ResourceLinkCollection", "GetAll", true)] // TODO -- restore this when this is fixed
        [TestCase("ResourceLinkCollection", "GetAllAsGenericResources", false)]
        [TestCase("ResourceLinkResource", "Get", true)]
        [TestCase("ResourceLinkResource", "Delete", true)]
        public void ValidateScopeResourceMethods(string className, string methodName, bool exist, params Type[] parameterTypes)
        {
            var classesToCheck = FindAllCollections().Concat(FindAllResources()).Append(FindExtensionClass());
            var classToCheck = classesToCheck.First(t => t.Name == className);
            var candidates = classToCheck.GetMethods().Where(m => m.Name == methodName).Where(m => ParameterMatch(m.GetParameters(), parameterTypes));
            Assert.AreEqual(exist, candidates.Any(), $"can{(exist ? "not" : string.Empty)} find {className}.{methodName}");
        }

        [Test]
        public void ValidateBinaryData()
        {
            var valueProperty = typeof(ParameterValuesValue).GetProperty("Value");
            Assert.IsNotNull(valueProperty);
            Assert.AreEqual(typeof(BinaryData), valueProperty.PropertyType);
        }
    }
}
