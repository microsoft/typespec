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
        private IReadOnlyList<ClientProvider>? _clients;

        public OutputLibrary()
        {
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
            }

            var models = new TypeProvider[input.Models.Count];
            for (int i = 0; i < models.Length; i++)
            {
                var inputModel = input.Models[i];
                var cSharpModel = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputModel);
                TypeProvider modelType = cSharpModel.Implementation;
                models[i] = modelType;
            }

            return (enums, models);
        }

        public IReadOnlyList<TypeProvider> Enums => BuildEnums();
        public IReadOnlyList<TypeProvider> Models => BuildModels();
        public IReadOnlyList<ClientProvider> Clients => _clients ??= BuildClients();

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

        //TODO should combine all typeproviders into one list vs models + enums + clients since they are all the same
        //https://github.com/microsoft/typespec/issues/3589
        private IReadOnlyList<TypeProvider>? _types;
        public virtual IReadOnlyList<TypeProvider> Types => _types ??= BuildTypes();
        protected virtual IReadOnlyList<TypeProvider> BuildTypes()
        {
            return
            [
                ChangeTrackingListProvider.Instance,
                ChangeTrackingDictionaryProvider.Instance,
                ArgumentProvider.Instance,
                OptionalProvider.Instance
            ];
        }
    }
}
