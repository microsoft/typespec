// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    /// <summary>
    /// Validates that enum types referenced only by protocol methods (convenientAPI false)
    /// are still generated. Regression test for https://github.com/microsoft/typespec/issues/8919
    /// </summary>
    public class EnumQueryParameterTests
    {
        [Test]
        public void QueryParameterEnumHasExpectedValues()
        {
            var values = Enum.GetValues(typeof(QueryParameterEnum));
            Assert.AreEqual(3, values.Length);
            Assert.IsTrue(Enum.IsDefined(typeof(QueryParameterEnum), QueryParameterEnum.OptionA));
            Assert.IsTrue(Enum.IsDefined(typeof(QueryParameterEnum), QueryParameterEnum.OptionB));
            Assert.IsTrue(Enum.IsDefined(typeof(QueryParameterEnum), QueryParameterEnum.OptionC));
        }

        [Test]
        public void ProtocolMethodHasEnumQueryParameter()
        {
            var clientType = typeof(SampleTypeSpecClient);
            var method = clientType.GetMethod("EnumQueryParameter", BindingFlags.Public | BindingFlags.Instance);
            Assert.IsNotNull(method, "EnumQueryParameter protocol method should exist on SampleTypeSpecClient.");

            var parameters = method!.GetParameters();
            Assert.IsTrue(
                parameters.Any(p => p.ParameterType == typeof(IEnumerable<QueryParameterEnum>)),
                "Protocol method should have an IEnumerable<QueryParameterEnum> parameter.");
            Assert.IsTrue(
                parameters.Any(p => p.ParameterType == typeof(RequestOptions)),
                "Protocol method should have a RequestOptions parameter.");
        }

        [Test]
        public void ProtocolMethodAsyncHasEnumQueryParameter()
        {
            var clientType = typeof(SampleTypeSpecClient);
            var method = clientType.GetMethod("EnumQueryParameterAsync", BindingFlags.Public | BindingFlags.Instance);
            Assert.IsNotNull(method, "EnumQueryParameterAsync protocol method should exist on SampleTypeSpecClient.");

            var parameters = method!.GetParameters();
            Assert.IsTrue(
                parameters.Any(p => p.ParameterType == typeof(IEnumerable<QueryParameterEnum>)),
                "Async protocol method should have an IEnumerable<QueryParameterEnum> parameter.");
        }

        [Test]
        public void NoConvenienceMethodOverloadExists()
        {
            var clientType = typeof(SampleTypeSpecClient);
            var methods = clientType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                .Where(m => m.Name == "EnumQueryParameter");

            // With convenientAPI(false), there should only be the protocol method (with RequestOptions).
            // No convenience overload without RequestOptions should exist.
            Assert.AreEqual(1, methods.Count(), "Only the protocol method overload should exist.");
        }
    }
}
