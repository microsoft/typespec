// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
            var inputClients = ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.RootClients;
            var types = new List<TypeProvider>();
            var clientOptionsSet = new HashSet<ClientOptionsProvider>();

            foreach (var inputClient in inputClients)
            {
                BuildClient(inputClient, types, clientOptionsSet);
            }

            // Add unique client options to the types list
            types.AddRange(clientOptionsSet);

            return [.. types];
        }

        private static void BuildClient(InputClient inputClient, IList<TypeProvider> types, HashSet<ClientOptionsProvider> clientOptionsSet)
        {
            foreach (var child in inputClient.Children)
            {
                BuildClient(child, types, clientOptionsSet);
            }

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            if (client == null)
            {
                return;
            }
            types.Add(client);
            types.Add(client.RestClient);
            var clientOptions = client.ClientOptions;
            if (clientOptions != null)
            {
                clientOptionsSet.Add(clientOptions);
            }

            foreach (var method in client.Methods)
            {
                if (method is ScmMethodProvider scmMethod && scmMethod.CollectionDefinition != null)
                {
                    types.Add(scmMethod.CollectionDefinition);
                }
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
                ScmCodeModelGenerator.Instance.ModelSerializationExtensionsDefinition,
                ScmCodeModelGenerator.Instance.SerializationFormatDefinition,
                new TypeFormattersDefinition(),
                new ErrorResultDefinition(),
                new ClientUriBuilderDefinition(),
                new Utf8JsonBinaryContentDefinition(),
                new BinaryContentHelperDefinition(),
                new ClientPipelineExtensionsDefinition(),
                new CancellationTokenExtensionsDefinition(),
                new PipelineRequestHeadersExtensionsDefinition(),
                .. GetMultipartFormDataBinaryContentDefinition(),
                new ModelReaderWriterContextDefinition()
            ];
        }

        private IEnumerable<TypeProvider> GetMultipartFormDataBinaryContentDefinition()
        {
            if (ScmCodeModelGenerator.Instance.InputLibrary.HasMultipartFormDataOperation)
            {
                var multipart = new MultiPartFormDataBinaryContentDefinition();
                ScmCodeModelGenerator.Instance.AddTypeToKeep(multipart.Name);
                yield return multipart;
            }
        }
    }
}
