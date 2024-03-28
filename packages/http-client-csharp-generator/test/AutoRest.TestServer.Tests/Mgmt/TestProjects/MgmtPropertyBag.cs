using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using Azure.Core.Pipeline;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;
using MgmtPropertyBag;
using MgmtPropertyBag.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    public class MgmtPropertyBagTests : TestProjectTests
    {
        public MgmtPropertyBagTests() : base("MgmtPropertyBag") { }

        [TestCase("MgmtPropertyBagExtensions", "GetFoos", true, typeof(SubscriptionResource), typeof(string), typeof(int?))]
        [TestCase("MgmtPropertyBagExtensions", "GetBars", true, typeof(SubscriptionResource), typeof(ETag?), typeof(int?))]
        [TestCase("FooCollection", "CreateOrUpdate", true, typeof(WaitUntil), typeof(string), typeof(FooData), typeof(string), typeof(int?), typeof(string))]
        [TestCase("FooCollection", "Get", true, typeof(FooCollectionGetOptions))]
        [TestCase("FooCollection", "GetAll", true, typeof(FooCollectionGetAllOptions))]
        [TestCase("FooResource", "Get", true, typeof(string), typeof(int?), typeof(string), typeof(ETag?), typeof(int?))]
        [TestCase("FooResource", "Update", true, typeof(FooPatch))]
        [TestCase("FooResource", "Reconnect", true, typeof(FooReconnectTestOptions))]
        [TestCase("BarCollection", "CreateOrUpdate", true, typeof(WaitUntil), typeof(string), typeof(BarData), typeof(string), typeof(int?), typeof(ETag?))]
        [TestCase("BarCollection", "Get", true, typeof(BarCollectionGetOptions))]
        [TestCase("BarCollection", "GetAll", true, typeof(BarCollectionGetAllOptions))]
        [TestCase("BarResource", "Get", true, typeof(string), typeof(string), typeof(int?), typeof(int?), typeof(IEnumerable<string>))]
        [TestCase("BarResource", "Update", true, typeof(WaitUntil), typeof(BarData), typeof(string), typeof(int?), typeof(ETag?))]
        public void ValidatePropertyBag(string className, string methodName, bool exist, params Type[] parameterTypes)
        {
            var classesToCheck = FindAllCollections().Concat(FindAllResources()).Append(FindExtensionClass());
            var classToCheck = classesToCheck.First(t => t.Name == className);
            var methods = classToCheck.GetMethods().Where(t => t.Name == methodName).Where(m => ParameterMatch(m.GetParameters(), parameterTypes));
            Assert.AreEqual(exist, methods.Any(), $"can{(exist ? "not" : string.Empty)} find {className}.{methodName} with parameters {string.Join(", ", (IEnumerable<Type>)parameterTypes)}");
        }

        [TestCaseSource(nameof(PropertyBagTestData))]
        public void ValidatePropertyBagGeneratesTheSameRequest(string barName, string ifMatch, string filter, int? top, int? skip, string[] items)
        {
            var barId = new ResourceIdentifier($"/subscriptions/{Guid.NewGuid()}/resourceGroups/testGroup/providers/Microsoft.Fake/bars/{barName}");
            var pipeline = HttpPipelineBuilder.Build(new ArmClientOptions
            {
                Transport = new FailureInjectingTransport(new HttpClientTransport(new MockHandler()))
            });

            var restOperation = new BarsRestOperations(pipeline, null);

            var rawMessage = restOperation.CreateGetRequest(barId.SubscriptionId, barId.ResourceGroupName, barName, ifMatch, filter, top, skip, items);

            var options = new BarCollectionGetOptions(barId.Name)
            {
                IfMatch = ifMatch,
                Filter = filter,
                Top = top,
                Skip = skip,
            };
            if (items is not null)
            {
                options.Items.Clear();
                foreach (var item in items)
                    options.Items.Add(item);
            }
            var messageWithOptions = restOperation.CreateGetRequest(barId.SubscriptionId, barId.ResourceGroupName, options.BarName, options.IfMatch, options.Filter, options.Top, options.Skip, options.Items);

            Assert.AreEqual(rawMessage.Request.Uri.PathAndQuery, messageWithOptions.Request.Uri.PathAndQuery);
        }

        private static readonly object[] PropertyBagTestData =
        {
            // all null value case
            new object[]
            {
                "testBar", null, null, null, null, null
            },
            // empty array case
            new object[]
            {
                "testBar", null, null, null, null, new string[0]
            },
            // all value case
            new object[]
            {
                "testBar", "ifMatch", "filter", 0, 1, new[] {"foo", "bar"}
            }
        };

        private class MockHandler : HttpMessageHandler
        {
            public MockHandler()
            {
            }

            protected override HttpResponseMessage Send(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                throw new NotImplementedException(); // we never send anything, therefore this is fine
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                throw new NotImplementedException(); // we never send anything, therefore this is fine
            }
        }
    }
}
