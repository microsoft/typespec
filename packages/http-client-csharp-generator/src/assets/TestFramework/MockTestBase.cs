// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core.TestFramework;
using Azure.ResourceManager.Resources;
using System;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace Azure.ResourceManager.TestFramework
{
    public abstract class MockTestBase
    {
        public MockTestBase(bool isAsync)
        {
        }

        public MockTestBase(bool isAsync, RecordedTestMode mode)
        {
        }

        protected async Task<ResourceGroupCollection> GetResourceGroupCollection(ArmClientOptions? clientOptions = default)
        {
            var client = GetArmClient(clientOptions);
            var sub = await client.GetSubscriptions().GetAsync("");
            return sub.Value.GetResourceGroups();
        }

        protected ArmClient GetArmClient(ArmClientOptions? clientOptions = default)
        {
            return new ArmClient(default);
        }
    }
}
