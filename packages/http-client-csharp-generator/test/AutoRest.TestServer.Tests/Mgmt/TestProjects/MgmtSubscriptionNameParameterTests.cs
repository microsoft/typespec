// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Reflection;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtSubscriptionNameParameterTests : TestProjectTests
    {
        public MgmtSubscriptionNameParameterTests() : base("MgmtSubscriptionNameParameter")
        {
        }
        [TestCase("SBSubscriptionCollection", "CreateOrUpdateAsync", new[] { "waitUntil", "subscriptionName", "data", "cancellationToken" })]
        [TestCase("SBSubscriptionCollection", "CreateOrUpdate", new[] { "waitUntil", "subscriptionName", "data", "cancellationToken" })]
        [TestCase("SBSubscriptionCollection", "Get", new[] { "subscriptionName", "cancellationToken" })]
        [TestCase("SBSubscriptionCollection", "GetAsync", new[] { "subscriptionName", "cancellationToken" })]
        public void ValidateParameter(string className, string methodName, string[] parameterNames)
        {
            var possibleTypesToFind = FindAllCollections().Concat(FindAllResources());
            var type = possibleTypesToFind.FirstOrDefault(t => t.Name == className);
            Assert.NotNull(type);
            var method = type.GetMethod(methodName);
            Assert.NotNull(method);
            var actualParameters = method.GetParameters().Select(p => p.Name).ToArray();
            Assert.AreEqual(actualParameters.Length, parameterNames.Length);
            for (int i = 0; i < actualParameters.Length; i++)
            {
                Assert.AreEqual(actualParameters[i], parameterNames[i]);
            }
        }
    }
}
