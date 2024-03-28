// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Azure.Core;
using Azure.ResourceManager.Models;
using NUnit.Framework;
using MgmtSupersetInheritance;
using MgmtSupersetInheritance.Models;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtSupersetInheritanceTests : TestProjectTests
    {
        public MgmtSupersetInheritanceTests()
            : base("MgmtSupersetInheritance")
        {
        }

        [TestCase(typeof(ResourceData), typeof(SupersetModel1Data))]
        [TestCase(typeof(Object), typeof(SupersetModel2))]
        [TestCase(typeof(Object), typeof(SupersetModel3))]
        [TestCase(typeof(TrackedResourceData), typeof(SupersetModel4Data))]
        [TestCase(typeof(TrackedResourceData), typeof(SupersetModel5))]
        [TestCase(typeof(ResourceData), typeof(SupersetModel6Data))]
        [TestCase(typeof(Object), typeof(SupersetModel7Data))]
        public void ValidateInheritanceType(Type expectedBaseType, Type generatedClass)
        {
            Assert.AreEqual(expectedBaseType, generatedClass.BaseType);
            foreach (var property in generatedClass.BaseType.GetProperties())
            {
                Assert.IsFalse(generatedClass.GetProperty(property.Name).DeclaringType == generatedClass);
            }
        }

        [TestCase(typeof(SupersetModel1Data), new string[] { }, new Type[] { })]
        [TestCase(typeof(SupersetModel2), new string[] { }, new Type[] { })]
        [TestCase(typeof(SupersetModel3), new string[] { }, new Type[] { })]
        [TestCase(typeof(SupersetModel4Data), new string[] { "location" }, new Type[] { typeof(AzureLocation) })]
        [TestCase(typeof(SupersetModel5), new string[] { "location" }, new Type[] { typeof(AzureLocation) })]
        [TestCase(typeof(SupersetModel6Data), new string[] { }, new Type[] { })]
        [TestCase(typeof(SupersetModel7Data), new string[] { }, new Type[] { })]
        public void ValidateCtor(Type model, string[] paramNames, Type[] paramTypes) => ValidatePublicCtor(model, paramNames, paramTypes);
    }
}
