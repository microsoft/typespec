// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using PaginationParams_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class PaginationParameterOverwriteTests
    {
        [Test]
        public void OverwriteTop()
        {
            Assert.AreEqual(new string[] { "maxCount", "skip", "maxpagesize", "context" }, GetMethodParameterNames("GetPaginationParamsAsync"));
        }

        [Test]
        public void NoOverwrite()
        {
            Assert.AreEqual(new string[] { "limit", "offset", "maxpagesize", "context" }, GetMethodParameterNames("Get2sAsync"));
        }

        [Test]
        public void OverwriteTopCaseIncensitive()
        {
            Assert.AreEqual(new string[] { "maxCount", "skip", "maxpagesize", "context" }, GetMethodParameterNames("Get3sAsync"));
        }

        [Test]
        public void NoOverwriteDueToOccupiedName()
        {
            Assert.AreEqual(new string[] { "top", "skip", "maxcount", "context" }, GetMethodParameterNames("Get4sAsync"));
        }

        private static IReadOnlyList<string> GetMethodParameterNames(string methodName)
        {
            var clazz = typeof(PaginationParamsClient);
            TypeAsserts.HasPublicInstanceMethod(clazz, methodName);
            var method = clazz.GetMethod(methodName, BindingFlags.Instance | BindingFlags.Public);
            return method.GetParameters().Select(p => p.Name).ToList();
        }
    }
}
