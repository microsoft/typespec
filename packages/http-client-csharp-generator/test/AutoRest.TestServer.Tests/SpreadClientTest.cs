// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using Azure.Core;
using NUnit.Framework;
using SpreadTypeSpec;
using SpreadTypeSpec.Models;

namespace AutoRest.TestServer.Tests
{
    public class SpreadClientTest
    {
        [Test]
        public void SpreadModelMethod()
        {
            var expected = new[]
            {
                (typeof(Thing), "thing", true)
            };
            ValidateConvenienceMethod(typeof(SpreadTypeSpecClient), "SpreadModel", expected);
        }

        [Test]
        public void SpreadAliasMethod()
        {
            var expected = new[]
            {
                (typeof(string), "name", true),
                (typeof(int), "age", true)
            };
            ValidateConvenienceMethod(typeof(SpreadTypeSpecClient), "SpreadAlias", expected);
        }

        [Test]
        public void SpreadMultiTargetAliasMethod()
        {
            var expected = new[]
            {
                (typeof(string), "id", true),
                (typeof(int), "top", true),
                (typeof(string), "name", true),
                (typeof(int), "age", true)
            };
            ValidateConvenienceMethod(typeof(SpreadTypeSpecClient), "SpreadMultiTargetAlias", expected);
        }

        [Test]
        public void SpreadAliasWithModelMethod()
        {
            var expected = new[]
            {
                (typeof(string), "id", true),
                (typeof(int), "top", true),
                (typeof(Thing), "thing", true)
            };
            ValidateConvenienceMethod(typeof(SpreadTypeSpecClient), "SpreadAliasWithModel", expected);
        }

        [Test]
        public void SpreadAliasWithSpreadAliasMethod()
        {
            var expected = new[]
            {
                (typeof(string), "id", true),
                (typeof(int), "top", true),
                (typeof(string), "name", true),
                (typeof(int), "age", true)
            };
            ValidateConvenienceMethod(typeof(SpreadTypeSpecClient), "SpreadAliasWithSpreadAlias", expected);
        }

        [Test]
        public void SpreadAliasWithOptionalPropsMethod()
        {
            var expected = new[]
            {
                (typeof(string), "id", true),
                (typeof(int), "top", true),
                (typeof(string), "name", true),
                (typeof(IEnumerable < int >), "items", true),
                (typeof(string), "color", false),
                (typeof(int?), "age", false),
                (typeof(IEnumerable<string>), "elements", false)
            };
            ValidateConvenienceMethod(typeof(SpreadTypeSpecClient), "SpreadAliasWithOptionalProps", expected);
        }

        private static void ValidateConvenienceMethod(Type clientType, string methodName, IEnumerable<(Type ParameterType, string Name, bool IsRequired)> expected)
        {
            var methods = FindMethods(clientType, methodName);

            foreach (var method in methods)
            {
                ValidateConvenienceMethodParameters(method, expected);
            }
        }

        private static IEnumerable<MethodInfo> FindMethods(Type clientType, string methodName)
        {
            var asyncMethodName = $"{methodName}Async";
            var methods = clientType.GetMethods();

            return methods.Where(m => m.Name.Equals(methodName) || m.Name.Equals(asyncMethodName));
        }

        private static void ValidateConvenienceMethodParameters(MethodInfo method, IEnumerable<(Type ParameterType, string Name, bool IsRequired)> expected)
        {
            if (IsProtocolMethod(method))
                return;
            var parameters = method.GetParameters().Where(p => !p.ParameterType.Equals(typeof(CancellationToken)));
            var parameterTypes = parameters.Select(p => p.ParameterType);
            var parameterNames = parameters.Select(p => p.Name);
            var parameterRequiredness = parameters.Select(p => !p.IsOptional);
            var expectedTypes = expected.Select(p => p.ParameterType);
            var expectedNames = expected.Select(p => p.Name);
            var expectedRequiredness = expected.Select(p => p.IsRequired);

            CollectionAssert.AreEqual(expectedTypes, parameterTypes);
            CollectionAssert.AreEqual(expectedNames, parameterNames);
            CollectionAssert.AreEqual(expectedRequiredness, parameterRequiredness);
        }

        private static bool IsProtocolMethod(MethodInfo method)
            => method.GetParameters().Any(parameter => parameter.ParameterType.Equals(typeof(RequestContent)));
    }
}
