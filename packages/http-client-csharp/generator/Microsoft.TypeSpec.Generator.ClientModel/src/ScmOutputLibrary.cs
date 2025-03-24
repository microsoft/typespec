// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel
{
    public class ScmOutputLibrary : OutputLibrary
    {
        private static TypeProvider[] BuildClientTypes()
        {
            var inputClients = ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.Clients;
            var clientTypes = new List<TypeProvider>();
            foreach (var inputClient in inputClients)
            {
                var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
                if (client == null)
                {
                    continue;
                }
                clientTypes.Add(client);
                clientTypes.Add(client.RestClient);
                var clientOptions = client.ClientOptions.Value;
                if (clientOptions != null)
                {
                    clientTypes.Add(clientOptions);
                }

                foreach (var method in client.Methods)
                {
                    if (method is ScmMethodProvider scmMethod && scmMethod.CollectionDefinition != null)
                    {
                        clientTypes.Add(scmMethod.CollectionDefinition);
                        ScmCodeModelGenerator.Instance.AddTypeToKeep(scmMethod.CollectionDefinition);
                    }
                }
            }

            return [.. clientTypes];
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
            if (ScmCodeModelGenerator.Instance.InputLibrary.HasMultipartFormDataOperation)
            {
                var multipart = new MultiPartFormDataBinaryContentDefinition();
                ScmCodeModelGenerator.Instance.AddTypeToKeep(multipart.Name);
                yield return multipart;
            }
        }
    }
}
