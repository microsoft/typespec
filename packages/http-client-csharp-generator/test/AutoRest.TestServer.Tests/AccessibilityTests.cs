// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using Accessibility_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class AccessibilityTests
    {
        [Test]
        public void AccessibilityHonoredOnOperations()
        {
            var client = typeof(AccessibilityClient);
            Assert.AreEqual(true, client.GetMethod ("Operation").IsPublic, "Operation should be public");
            Assert.AreEqual(true, client.GetMethod ("OperationAsync").IsPublic, "OperationAsync should be public");
            Assert.AreEqual(true, client.GetMethod ("OperationInternal", BindingFlags.Instance | BindingFlags.NonPublic).IsAssembly, "OperationInternal should be internal");
            Assert.AreEqual(true, client.GetMethod ("OperationInternalAsync", BindingFlags.Instance | BindingFlags.NonPublic).IsAssembly, "OperationInternalAsync should be internal");
        }
    }
}
