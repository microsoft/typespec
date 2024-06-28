// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmOutputLibrary : OutputLibrary
    {
        private static TypeProvider[] BuildClients()
        {
            var inputClients = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Clients;
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
            var systemOptionalProvider = new SystemOptionalProvider();

            for (var i = 0; i < baseTypes.Length; i++)
            {
                if (baseTypes[i] is OptionalProvider)
                {
                    baseTypes[i] = systemOptionalProvider;
                }
            }

            return [
                ..baseTypes,
                ..BuildClients(),
                new ModelSerializationExtensionsProvider(),
                new TypeFormattersProvider(),
                new ClientPipelineExtensionsProvider(),
                new ErrorResultProvider()
            ];
        }
    }
}
