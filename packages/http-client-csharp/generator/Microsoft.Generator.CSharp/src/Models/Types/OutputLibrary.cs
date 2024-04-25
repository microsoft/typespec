// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public class OutputLibrary
    {
        private IReadOnlyList<ModelTypeProvider>? _models;
        private IReadOnlyList<ClientTypeProvider>? _clients;

        public OutputLibrary()
        {
            EnumMappings = new Dictionary<InputEnumType, EnumType>();
            ModelMappings = new Dictionary<InputModelType, ModelTypeProvider>();
        }

        public IReadOnlyList<ModelTypeProvider> Models => _models ??= BuildModels();
        public IReadOnlyList<ClientTypeProvider> Clients => _clients ??= BuildClients();

        public IDictionary<InputEnumType, EnumType> EnumMappings { get; }
        public IDictionary<InputModelType, ModelTypeProvider> ModelMappings { get; }

        public virtual ModelTypeProvider[] BuildModels()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;

            var modelsCount = input.Models.Count;
            ModelTypeProvider[] modelProviders = new ModelTypeProvider[modelsCount];

            for (int i = 0; i < modelsCount; i++)
            {
                var model = input.Models[i];
                var typeProvider = new ModelTypeProvider(model, null);

                modelProviders[i] = typeProvider;
                ModelMappings.Add(model, typeProvider);
            }

            return modelProviders;
        }

        public virtual ClientTypeProvider[] BuildClients()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;

            var clientsCount = input.Clients.Count;
            ClientTypeProvider[] clientProviders = new ClientTypeProvider[clientsCount];

            for (int i = 0; i < clientsCount; i++)
            {
                clientProviders[i] = new ClientTypeProvider(input.Clients[i], null);
            }

            return clientProviders;
        }
    }
}
