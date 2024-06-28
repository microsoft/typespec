// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.TestPlugin
{
    public class TestPluginOutputLibrary : OutputLibrary
    {
        private static TypeProvider[] BuildClients()
        {
            var inputClients = TestCodeModelPlugin.Instance.InputLibrary.InputNamespace.Clients;
            var clients = new TypeProvider[inputClients.Count];
            for (int i = 0; i < clients.Length; i++)
            {
                clients[i] = new ClientProvider(inputClients[i]);
            }

            return clients;
        }

        protected override TypeProvider[] BuildTypeProviders()
        {
            var baseTypes = base.BuildTypeProviders();

            return [
                ..baseTypes,
                ..BuildClients()
            ];
        }
    }
}
