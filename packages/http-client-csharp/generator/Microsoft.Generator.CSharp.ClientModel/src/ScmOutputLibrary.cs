// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmOutputLibrary : OutputLibrary
    {
        private static TypeProvider[] BuildClients()
        {
            var inputClients = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Clients;
            var clients = new List<TypeProvider>(inputClients.Count * 3);
            foreach (var inputClient in inputClients)
            {
                var client = ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient);
                clients.Add(client);
                clients.Add(client.RestClient);
                clients.Add(client.ClientOptions);
            }

            return [.. clients];
        }

        protected override TypeProvider[] BuildTypeProviders()
        {
            var baseTypes = base.BuildTypeProviders();
            var systemOptionalProvider = new SystemOptionalDefinition();

            for (var i = 0; i < baseTypes.Length; i++)
            {
                if (baseTypes[i] is OptionalDefinition)
                {
                    baseTypes[i] = systemOptionalProvider;
                }
            }

            return [
                ..baseTypes,
                ..BuildClients(),
                new ModelSerializationExtensionsDefinition(),
                new TypeFormattersDefinition(),
                new ClientPipelineExtensionsDefinition(),
                new ErrorResultDefinition(),
                new ClientUriBuilderDefinition(),
            ];
        }
    }
}
