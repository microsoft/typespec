// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmOutputLibrary : OutputLibrary
    {
        public override IEnumerable<TypeProvider> Providers
        {
            get
            {
                foreach (var provider in BuildClients())
                {
                    yield return provider;
                }

                foreach (var provider in base.Providers)
                {
                    yield return provider;
                }
            }
        }

        private ClientProvider[] BuildClients()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;

            var clientsCount = input.Clients.Count;
            ClientProvider[] clientProviders = new ClientProvider[clientsCount];

            for (int i = 0; i < clientsCount; i++)
            {
                clientProviders[i] = new ClientProvider(input.Clients[i]);
            }

            return clientProviders;
        }
    }
}
