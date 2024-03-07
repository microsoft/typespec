using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using Azure.ResourceManager.Resources;
using MgmtListMethods.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtListMethodsTests : TestProjectTests
    {
        public MgmtListMethodsTests() : base("MgmtListMethods") { }

        // Added tests based on https://microsoft-my.sharepoint.com/:x:/r/personal/micnash_microsoft_com/_layouts/15/Doc.aspx?sourcedoc=%7B181E196F-FC6E-48FB-9CE1-FF143C31B11C%7D&file=ListTestMatrix.xlsx&wdLOR=cE86BCE07-4BBA-48BB-A656-DD19A49E42B5&action=default&mobileredirect=true&share=IQFvGR4Ybvz7SJzh_xQ8MbEcAXMqmVNmXOiC_wmRJHx17jE&cid=c36f7b84-dc61-40e3-bc9d-b82a4509a6e9

        // Validate list methods when resourceGroups is a parent
        [TestCase("ResGrpParentWithAncestorWithNonResChWithLocCollection", "GetAll", true)]
        [TestCase("ResGrpParentWithAncestorWithNonResChWithLocResource", "GetAll", false)]
        [TestCase("ResGrpParentWithAncestorWithNonResChWithLocCollection", "GetNonResourceChild", false)]
        [TestCase("ResGrpParentWithAncestorWithNonResChWithLocResource", "GetNonResourceChild", true)]
        [TestCase("MgmtListMethodsExtensions", "GetResGrpParentWithAncestorWithNonResChWithLocs", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "GetResGrpParentWithAncestorWithNonResChWithLocs", true, typeof(ResourceGroupResource))]

        [TestCase("ResGrpParentWithAncestorWithNonResChCollection", "GetAll", true)]
        [TestCase("ResGrpParentWithAncestorWithNonResChResource", "GetAll", false)]
        [TestCase("ResGrpParentWithAncestorWithNonResChCollection", "GetNonResourceChild", false)]
        [TestCase("ResGrpParentWithAncestorWithNonResChResource", "GetNonResourceChild", true)]
        [TestCase("MgmtListMethodsExtensions", "GetResGrpParentWithAncestorWithNonResChes", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "GetResGrpParentWithAncestorWithNonResChes", true, typeof(ResourceGroupResource))]

        [TestCase("ResGrpParentWithAncestorWithLocCollection", "GetAll", true)]
        [TestCase("ResGrpParentWithAncestorWithLocResource", "GetAll", false)]
        [TestCase("MgmtListMethodsExtensions", "GetResGrpParentWithAncestorWithLocs", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "GetResGrpParentWithAncestorWithLocs", true, typeof(ResourceGroupResource))]

        [TestCase("ResGrpParentWithAncestorCollection", "GetAll", true)]
        [TestCase("ResGrpParentWithAncestorResource", "GetAll", false)]

        [TestCase("ResGrpParentWithNonResChCollection", "GetAll", true)]
        [TestCase("ResGrpParentWithNonResChResource", "GetAll", false)]
        [TestCase("ResGrpParentWithNonResChCollection", "GetNonResourceChild", false)]
        [TestCase("ResGrpParentWithNonResChResource", "GetNonResourceChild", true)]

        [TestCase("ResGrpParentCollection", "GetAll", true)]
        [TestCase("ResGrpParentResource", "GetAll", false)]
        public void ValidateResourceGroupsAsAParentListMethods(string className, string methodName, bool exist, params Type[] parameterTypes)
        {
            ValidateListMethods(className, methodName, exist, parameterTypes);
        }

        // Validate list methods when fake resource is a parent
        [TestCase("FakeCollection", "GetAll", true)]
        [TestCase("FakeResource", "GetAll", false)]

        [TestCase("FakeParentWithAncestorWithNonResChWithLocCollection", "GetAll", true)]
        [TestCase("FakeParentWithAncestorWithNonResChWithLocResource", "GetAll", false)]
        [TestCase("FakeParentWithAncestorWithNonResChWithLocCollection", "GetNonResourceChild", false)]
        [TestCase("FakeParentWithAncestorWithNonResChWithLocResource", "GetNonResourceChild", true)]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestorWithNonResourceChWithLoc", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestorWithNonResourceChWithLoc", false, typeof(ResourceGroupResource))]

        [TestCase("FakeParentWithAncestorWithNonResChCollection", "GetAll", true)]
        [TestCase("FakeParentWithAncestorWithNonResChResource", "GetAll", false)]
        [TestCase("FakeParentWithAncestorWithNonResChCollection", "GetNonResourceChild", false)]
        [TestCase("FakeParentWithAncestorWithNonResChResource", "GetNonResourceChild", true)]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestorWithNonResChes", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestorWithNonResChes", false, typeof(ResourceGroupResource))]

        [TestCase("FakeParentWithAncestorWithLocCollection", "GetAll", true)]
        [TestCase("FakeParentWithAncestorWithLocResource", "GetAll", false)]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestorWithLocs", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestorWithLocs", false, typeof(ResourceGroupResource))]

        [TestCase("FakeParentWithAncestorCollection", "GetAll", true)]
        [TestCase("FakeParentWithAncestorResource", "GetAll", false)]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestors", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "GetFakeParentWithAncestors", false, typeof(ResourceGroupResource))]

        [TestCase("FakeParentWithNonResChCollection", "GetAll", true)]
        [TestCase("FakeParentWithNonResChResource", "GetAll", false)]
        [TestCase("FakeParentWithNonResChCollection", "GetNonResourceChild", false)]
        [TestCase("FakeParentWithNonResChResource", "GetNonResourceChild", true)]

        [TestCase("FakeParentCollection", "GetAll", true)]
        [TestCase("FakeParentResource", "GetAll", false)]

        [TestCase("MgmtListMethodsExtensions", "UpdateAllQuota", true, typeof(SubscriptionResource))]
        [TestCase("MgmtListMethodsExtensions", "UpdateAllQuota", false, typeof(ResourceGroupResource))]

        [TestCase("FakeConfigurationCollection", "GetAll", true)]
        [TestCase("FakeResource", "UpdateConfigurations", true, typeof(FakeConfigurationListResult), typeof(CancellationToken))]
        public void ValidateFakesResourceAsAParentListMethods(string className, string methodName, bool exist, params Type[] parameterTypes)
        {
            ValidateListMethods(className, methodName, exist, parameterTypes);
        }

        // Validate list methods when subscriptions is a parent
        [TestCase("SubParentWithNonResChWithLocCollection", "GetAll", true)]
        [TestCase("SubParentWithNonResChWithLocResource", "GetAll", false)]
        [TestCase("SubParentWithNonResChWithLocCollection", "GetNonResourceChild", false)]
        [TestCase("SubParentWithNonResChWithLocResource", "GetNonResourceChild", true)]

        [TestCase("SubParentWithNonResChCollection", "GetAll", true)]
        [TestCase("SubParentWithNonResChResource", "GetAll", false)]
        [TestCase("SubParentWithNonResChCollection", "GetNonResourceChild", false)]
        [TestCase("SubParentWithNonResChResource", "GetNonResourceChild", true)]

        [TestCase("SubParentWithLocCollection", "GetAll", true)]
        [TestCase("SubParentWithLocResource", "GetAll", false)]

        [TestCase("SubParentWithLocCollection", "GetAll", true)]
        [TestCase("SubParentWithLocResource", "GetAll", false)]
        public void ValidateSubscriptionsAsAParentListMethods(string className, string methodName, bool exist)
        {
            ValidateListMethods(className, methodName, exist);
        }

        // Validate list methods when management groups is a parent
        [TestCase("MgmtGrpParentWithNonResChWithLocCollection", "GetAll", true)]
        [TestCase("MgmtGrpParentWithNonResChWithLocResource", "GetAll", false)]
        [TestCase("MgmtGrpParentWithNonResChWithLocCollection", "GetNonResourceChild", false)]
        [TestCase("MgmtGrpParentWithNonResChWithLocResource", "GetNonResourceChild", true)]

        [TestCase("MgmtGrpParentWithNonResChCollection", "GetAll", true)]
        [TestCase("MgmtGrpParentWithNonResChResource", "GetAll", false)]
        [TestCase("MgmtGrpParentWithNonResChCollection", "GetNonResourceChild", false)]
        [TestCase("MgmtGrpParentWithNonResChResource", "GetNonResourceChild", true)]

        [TestCase("MgmtGrpParentWithLocCollection", "GetAll", true)]
        [TestCase("MgmtGrpParentWithLocResource", "GetAll", false)]

        [TestCase("MgmtGroupParentCollection", "GetAll", true)]
        [TestCase("MgmtGroupParentResource", "GetAll", false)]
        public void ValidateMgmtGroupsAsAParentListMethods(string className, string methodName, bool exist)
        {
            ValidateListMethods(className, methodName, exist);
        }

        // Validate list methods when tenant is a parent
        [TestCase("TenantParentWithNonResChWithLocCollection", "GetAll", true)]
        [TestCase("TenantParentWithNonResChWithLocResource", "GetAll", false)]
        [TestCase("TenantParentWithNonResChWithLocCollection", "GetNonResourceChild", false)]
        [TestCase("TenantParentWithNonResChWithLocResource", "GetNonResourceChild", true)]

        [TestCase("TenantParentWithNonResChCollection", "GetAll", true)]
        [TestCase("TenantParentWithNonResChResource", "GetAll", false)]
        [TestCase("TenantParentWithNonResChCollection", "GetNonResourceChild", false)]
        [TestCase("TenantParentWithNonResChResource", "GetNonResourceChild", true)]

        [TestCase("TenantParentWithLocCollection", "GetAll", true)]
        [TestCase("TenantParentWithLocResource", "GetAll", false)]

        [TestCase("TenantParentCollection", "GetAll", true)]
        [TestCase("TenantParentResource", "GetAll", false)]
        public void ValidateTenantAsAParentListMethods(string className, string methodName, bool exist)
        {
            ValidateListMethods(className, methodName, exist);
        }

        public void ValidateListMethods(string className, string methodName, bool exist, params Type[] parameterTypes)
        {
            var classesToCheck = FindAllCollections().Concat(FindAllResources()).Append(FindExtensionClass());
            var classToCheck = classesToCheck.First(t => t.Name == className);
            var methods = classToCheck.GetMethods().Where(t => t.Name == methodName).Where(m => ParameterMatch(m.GetParameters(), parameterTypes));
            Assert.AreEqual(exist, methods.Any(), $"can{(exist ? "not" : string.Empty)} find {className}.{methodName} with parameters {string.Join(", ", (IEnumerable<Type>)parameterTypes)}");
        }
    }
}
