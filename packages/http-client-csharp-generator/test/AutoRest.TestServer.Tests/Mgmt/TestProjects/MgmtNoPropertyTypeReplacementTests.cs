// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Reflection;
using Azure.ResourceManager.Resources.Models;
using MgmtNoTypeReplacement;
using MgmtNoTypeReplacement.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtNoPropertyTypeReplacementTests : TestProjectTests
    {
        public MgmtNoPropertyTypeReplacementTests()
            : base("MgmtNoTypeReplacement")
        {
        }

        [TestCase(typeof(SubResource), typeof(NoTypeReplacementModel1Data))]
        [TestCase(typeof(NoSubResourceModel), typeof(NoTypeReplacementModel2Data))]
        [TestCase(typeof(NoSubResourceModel2), typeof(MiddleResourceModel))]
        public void ValidateType(Type expectedType, Type targetClass)
        {
            Assert.AreEqual(expectedType, targetClass.GetProperty("Foo", BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Instance).PropertyType);
        }

    }
}
