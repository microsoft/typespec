// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public class OutputLibrary
    {
        private IReadOnlyList<EnumProvider>? _enums;
        private IReadOnlyList<ModelProvider>? _models;
        private IReadOnlyList<ClientProvider>? _clients;

        public OutputLibrary()
        {
            EnumMappings = new Dictionary<InputEnumType, EnumProvider>();
            ModelMappings = new Dictionary<InputModelType, ModelProvider>();

            _allModels = new(InitializeAllModels);
        }

        private readonly Lazy<(EnumProvider[] Enums, ModelProvider[] Models)> _allModels;

        private (EnumProvider[] Enums, ModelProvider[] Models) InitializeAllModels()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;

            var enums = new EnumProvider[input.Enums.Count];
            for (int i = 0; i < enums.Length; i++)
            {
                var inputEnum = input.Enums[i];
                var enumType = EnumProvider.Create(inputEnum);
                enums[i] = enumType;
                EnumMappings.Add(inputEnum, enumType);
            }

            var models = new ModelProvider[input.Models.Count];
            for (int i = 0; i < models.Length; i++)
            {
                var inputModel = input.Models[i];
                var model = new ModelProvider(inputModel);
                models[i] = model;
                ModelMappings.Add(inputModel, model);
            }

            return (enums, models);
        }

        public IReadOnlyList<EnumProvider> Enums => _enums ??= BuildEnums();
        public IReadOnlyList<ModelProvider> Models => _models ??= BuildModels();
        public IReadOnlyList<ClientProvider> Clients => _clients ??= BuildClients();

        public IDictionary<InputEnumType, EnumProvider> EnumMappings { get; }
        public IDictionary<InputModelType, ModelProvider> ModelMappings { get; }

        public virtual EnumProvider[] BuildEnums()
        {
            return _allModels.Value.Enums;
        }

        public virtual ModelProvider[] BuildModels()
        {
            return _allModels.Value.Models;
        }

        public virtual ClientProvider[] BuildClients()
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
