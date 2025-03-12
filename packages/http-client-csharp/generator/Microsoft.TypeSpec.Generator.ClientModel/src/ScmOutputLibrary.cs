// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel
{
    public class ScmOutputLibrary : OutputLibrary
    {
        private static TypeProvider[] BuildClientTypes()
        {
            var inputClients = ScmCodeModelPlugin.Instance.InputLibrary.InputNamespace.Clients;
            var clients = new List<TypeProvider>();
            foreach (var inputClient in inputClients)
            {
                BuildClient(inputClient, clients);
            }

            return [.. clients];
        }

        private static void BuildClient(InputClient inputClient, IList<TypeProvider> clients)
        {
            var client = ScmCodeModelPlugin.Instance.TypeFactory.CreateClient(inputClient);
            if (client == null)
            {
                return;
            }
            clients.Add(client);
            clients.Add(client.RestClient);
            var clientOptions = client.ClientOptions.Value;
            if (clientOptions != null)
            {
                clients.Add(clientOptions);
            }

            foreach (var method in client.Methods)
            {
                if (method is ScmMethodProvider scmMethod && scmMethod.CollectionDefinition != null)
                {
                    clients.Add(scmMethod.CollectionDefinition);
                    ScmCodeModelPlugin.Instance.AddTypeToKeep(scmMethod.CollectionDefinition);
                }
            }

            foreach (var child in inputClient.Children)
            {
                BuildClient(child, clients);
            }
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
                ..BuildClientTypes(),
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
            if (ScmCodeModelPlugin.Instance.InputLibrary.HasMultipartFormDataOperation)
            {
                var multipart = new MultiPartFormDataBinaryContentDefinition();
                ScmCodeModelPlugin.Instance.AddTypeToKeep(multipart.Name);
                yield return multipart;
            }
        }
    }
}
