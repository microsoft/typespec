// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using ResourceClients_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class ResourceClient
    {
        [Test]
        public void ResourceServiceClient_PublicMethods()
        {
            TypeAsserts.TypeOnlyDeclaresThesePublicMethods(typeof(ResourceServiceClient), "GetParameters", "GetParametersAsync", "GetResourceGroup", "GetGroups", "GetGroupsAsync", "GetAllItems", "GetAllItemsAsync");
        }

        [Test]
        public void ResourceGroup_PublicMethods()
        {
            TypeAsserts.TypeOnlyDeclaresThesePublicMethods(typeof(ResourceGroup), "GetGroup", "GetGroupAsync", "GetResource", "GetItems", "GetItemsAsync");
        }

        [Test]
        public void Resource_PublicMethods()
        {
            TypeAsserts.TypeOnlyDeclaresThesePublicMethods(typeof(Resource), "GetItem", "GetItemAsync");
        }
    }
}
