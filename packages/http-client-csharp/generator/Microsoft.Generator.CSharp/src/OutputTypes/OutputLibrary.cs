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
        private IReadOnlyList<TypeProvider>? _enums;
        private IReadOnlyList<TypeProvider>? _models;
        private IReadOnlyList<ClientProvider>? _clients;

        public OutputLibrary()
        {
            EnumMappings = new Dictionary<InputEnumType, TypeProvider>();
            ModelMappings = new Dictionary<InputModelType, TypeProvider>();

            _allModels = new(InitializeAllModels);
        }

        private (TypeProvider[] Enums, TypeProvider[] Models) InitializeAllModels()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;

            var enums = new TypeProvider[input.Enums.Count];
            for (int i = 0; i < enums.Length; i++)
            {
                var inputEnum = input.Enums[i];
                var cSharpEnum = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputEnum);
                TypeProvider enumType = cSharpEnum.Implementation;
                enums[i] = enumType;
                EnumMappings.Add(inputEnum, enumType);
            }

            var models = new TypeProvider[input.Models.Count];
            for (int i = 0; i < models.Length; i++)
            {
                var inputModel = input.Models[i];
                var cSharpModel = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputModel);
                TypeProvider modelType = cSharpModel.Implementation;
                models[i] = modelType;
                ModelMappings.Add(inputModel, modelType);
            }

            return (enums, models);
        }

        public IReadOnlyList<TypeProvider> Enums => _enums ??= BuildEnums();
        public IReadOnlyList<TypeProvider> Models => _models ??= BuildModels();
        public IReadOnlyList<ClientProvider> Clients => _clients ??= BuildClients();

        private IDictionary<InputEnumType, TypeProvider> EnumMappings { get; }
        private IDictionary<InputModelType, TypeProvider> ModelMappings { get; }

        private readonly Lazy<(TypeProvider[] Enums, TypeProvider[] Models)> _allModels;

        public virtual TypeProvider[] BuildEnums()
        {
            return _allModels.Value.Enums;
        }

        public virtual TypeProvider[] BuildModels()
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
