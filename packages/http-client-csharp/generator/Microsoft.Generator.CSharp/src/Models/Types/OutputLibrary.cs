// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public class OutputLibrary
    {
        private IReadOnlyList<EnumTypeProvider>? _enums;
        private IReadOnlyList<ModelTypeProvider>? _models;
        private IReadOnlyList<ClientTypeProvider>? _clients;

        public OutputLibrary()
        {
            EnumMappings = new Dictionary<InputEnumType, EnumTypeProvider>();
            ModelMappings = new Dictionary<InputModelType, ModelTypeProvider>();

            _allModels = new(InitializeAllModels);
        }

        private readonly Lazy<(EnumTypeProvider[] Enums, ModelTypeProvider[] Models)> _allModels;

        private (EnumTypeProvider[] Enums, ModelTypeProvider[] Models) InitializeAllModels()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;

            var enums = new EnumTypeProvider[input.Enums.Count];
            for (int i = 0; i < enums.Length; i++)
            {
                var inputEnum = input.Enums[i];
                var enumType = new EnumTypeProvider(inputEnum, null);
                enums[i] = enumType;
                EnumMappings.Add(inputEnum, enumType);
            }

            var models = new ModelTypeProvider[input.Models.Count];
            for (int i = 0; i < models.Length; i++)
            {
                var inputModel = input.Models[i];
                var model = new ModelTypeProvider(inputModel, null);
                models[i] = model;
                ModelMappings.Add(inputModel, model);
            }

            return (enums, models);
        }

        public IReadOnlyList<EnumTypeProvider> Enums => _enums ??= BuildEnums();
        public IReadOnlyList<ModelTypeProvider> Models => _models ??= BuildModels();
        public IReadOnlyList<ClientTypeProvider> Clients => _clients ??= BuildClients();

        public IDictionary<InputEnumType, EnumTypeProvider> EnumMappings { get; }
        public IDictionary<InputModelType, ModelTypeProvider> ModelMappings { get; }

        public virtual EnumTypeProvider[] BuildEnums()
        {
            return _allModels.Value.Enums;
        }

        public virtual ModelTypeProvider[] BuildModels()
        {
            return _allModels.Value.Models;
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
