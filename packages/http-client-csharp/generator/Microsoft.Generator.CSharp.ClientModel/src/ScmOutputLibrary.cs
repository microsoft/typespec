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
                var clientOptions = client.ClientOptions;
                if (clientOptions != null)
                {
                    clients.Add(clientOptions);
                }
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
                new Utf8JsonBinaryContentDefinition(),
                new BinaryContentHelperDefinition(),
                new PipelineRequestHeadersExtensionsDefinition(),
                .. GetMultipartFormDataBinaryContentDefinition()
            ];
        }

        private IEnumerable<TypeProvider> GetMultipartFormDataBinaryContentDefinition()
        {
            if (ClientModelPlugin.Instance.InputLibrary.HasMultipartFormDataOperation)
            {
                var multipart = new MultiPartFormDataBinaryContentDefinition();
                ClientModelPlugin.Instance.AddTypeToKeep(multipart.Name);
                yield return multipart;
            }
        }
    }
}
