// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using System;
using System.Collections.Generic;

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
        }

        public IReadOnlyList<EnumTypeProvider> Enums => _enums ??= BuildEnums();
        public IReadOnlyList<ModelTypeProvider> Models => _models ??= BuildModels();
        public IReadOnlyList<ClientTypeProvider> Clients => _clients ??= BuildClients();

        public IDictionary<InputEnumType, EnumTypeProvider> EnumMappings { get; }
        public IDictionary<InputModelType, ModelTypeProvider> ModelMappings { get; }

        public virtual EnumTypeProvider[] BuildEnums()
        {
            // TODO -- this is not correct, enums are only built when `Enums` is called which is only called when we are trying to write the enums.
            // when building the model's property, we still have the possibility (very very likely) to need enums
            // TODO -- we need to change how these things are loaded
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;

            var enumsCount = input.Enums.Count;
            var enumProviders = new EnumTypeProvider[enumsCount];

            for (int i = 0; i < enumsCount; i++)
            {
                var inputEnum = input.Enums[i];
                var enumType = new EnumTypeProvider(inputEnum, null);
                enumProviders[i] = enumType;
                EnumMappings.Add(inputEnum, enumType);
            }

            return enumProviders;
        }

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
