// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using Parameters.Spread.Models;
using Parameters.Spread;
using System.Collections.Generic;
using System.Reflection;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;

namespace TestProjects.CadlRanch.Tests.Http.Parameters.Spread
{
    public class SpreadTests : CadlRanchTestBase
    {
        [Test]
        public void VerifySpreadParameterWithInnerModelMethod()
        {
            var expected = new[]
            {
                (typeof(string), "id", true),
                (typeof(string), "xMsTestHeader", true),
                (typeof(string), "name", true),
            };
            ValidateConvenienceMethod(typeof(Alias), "SpreadParameterWithInnerModel", expected);
        }

        [Test]
        public void VerifySpreadParameterWithInnerAliasMethod()
        {
            var expected = new[]
            {
                (typeof(string), "id", true),
                (typeof(string), "xMsTestHeader", true),
                (typeof(string), "name", true),
                (typeof(int), "age", true)
            };
            ValidateConvenienceMethod(typeof(Alias), "SpreadParameterWithInnerAlias", expected);
        }

        [Test]
        public void VerifySpreadAsRequestBodyInModelMethod()
        {
            var expected = new[]
            {
                (typeof(string), "name", true),
            };
            ValidateConvenienceMethod(typeof(Model), "SpreadAsRequestBody", expected);
        }

        [Test]
        public void VerifySpreadAsRequestBodyInAliasMethod()
        {
            var expected = new[]
            {
                (typeof(string), "name", true),
            };
            ValidateConvenienceMethod(typeof(Alias), "SpreadAsRequestBody", expected);
        }

        [CadlRanchTest]
        public Task Model_SpreadAsRequestBody() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetModelClient().SpreadAsRequestBodyAsync("foo");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Model_SpreadCompositeRequest() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetModelClient().SpreadCompositeRequestAsync("foo", "bar", new BodyParameter("foo"));
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Model_SpreadCompositeRequestMix() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetModelClient().SpreadCompositeRequestMixAsync("foo", "bar", "foo");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Model_SpreadCompositeRequestOnlyWithBody() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetModelClient().SpreadCompositeRequestOnlyWithBodyAsync(new BodyParameter("foo"));
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Model_SpreadCompositeRequestOnlyWithoutBody() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetModelClient().SpreadCompositeRequestWithoutBodyAsync("foo", "bar");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Alias_SpreadAsRequestBody() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetAliasClient().SpreadAsRequestBodyAsync("foo");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Alias_SpreadAsRequestParameter() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetAliasClient().SpreadAsRequestParameterAsync("1", "bar", "foo");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Alias_SpreadWithMultipleParameters() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetAliasClient().SpreadWithMultipleParametersAsync("1", "bar", "foo", new[] { 1, 2 }, 1, new[] { "foo", "bar" });
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Alias_SpreadWithModel() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetAliasClient().SpreadParameterWithInnerModelAsync("1", "bar", "foo");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Alias_SpreadAliasinAlias() => Test(async (host) =>
        {
            ClientResult result = await new SpreadClient(host, null).GetAliasClient().SpreadParameterWithInnerAliasAsync("1", "bar", "foo", 1);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

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
            if (method.Name.EndsWith("Async"))
            {
                expected = expected.Append((typeof(CancellationToken), "cancellationToken", false));
            }
            var parameters = method.GetParameters().Where(p => !p.ParameterType.Equals(typeof(RequestOptions)));
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
            => method.GetParameters().Any(parameter => parameter.ParameterType.Equals(typeof(BinaryContent)));
    }
}
