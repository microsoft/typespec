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
            var clients = new List<TypeProvider>();
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
            var updatedBaseTypes = new List<TypeProvider>(baseTypes.Length);
            var systemOptionalProvider = new SystemOptionalDefinition();

            foreach (var t in baseTypes)
            {
                if (t is OptionalDefinition)
                {
                    updatedBaseTypes.Add(systemOptionalProvider);
                }
                else if (!(t is EnumProvider enumProvider && enumProvider.IsApiVersion))
                {
                    updatedBaseTypes.Add(t);
                }
            }

            return [
                .. updatedBaseTypes,
                .. BuildClients(),
                new ModelSerializationExtensionsDefinition(),
                new TypeFormattersDefinition(),
                new ClientPipelineExtensionsDefinition(),
                new ErrorResultDefinition(),
                new ClientUriBuilderDefinition(),
            ];
        }
    }
}
