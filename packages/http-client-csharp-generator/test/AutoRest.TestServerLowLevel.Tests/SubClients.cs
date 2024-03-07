// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using NUnit.Framework;
using SubClients_LowLevel;
using SingleTopLevelClientWithOperations_LowLevel;
using SingleTopLevelClientWithoutOperations_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class SubClientTests
    {
        [Test]
        public void SubClient_PublicMethods()
        {
            TypeAsserts.HasPublicInstanceMethod(typeof(RootClient), $"Get{nameof(Parameter)}Client");
        }

        [Test]
        public void SubClient_CachedInstance()
        {
            var p = "p";
            var rootClient = new RootClient(p, new AzureKeyCredential("fake-key"));
            var parameterClient1 = rootClient.GetParameterClient();
            var parameterClient2 = rootClient.GetParameterClient();
            Assert.AreSame(parameterClient1, parameterClient2);
        }

        [Test]
        public void TopLevelClientWithOperation_PublicMethods()
        {
            TypeAsserts.TypeOnlyDeclaresThesePublicMethods(typeof(TopLevelClientWithOperationClient), "Operation", "OperationAsync", "GetAll", "GetAllAsync", $"Get{nameof(Client1)}Client", $"Get{nameof(Client2)}Client", $"Get{nameof(Client4)}");
        }

        [Test]
        public void TopLevelClientWithoutOperation_PublicMethods()
        {
            TypeAsserts.TypeOnlyDeclaresThesePublicMethods(typeof(TopLevelClientWithoutOperationClient), $"Get{nameof(Client5)}Client", $"Get{nameof(Client6)}Client", $"Get{nameof(Client7)}Client");
        }
    }
}
