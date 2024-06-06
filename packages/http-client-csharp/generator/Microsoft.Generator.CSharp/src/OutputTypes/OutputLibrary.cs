// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using System.ComponentModel.Composition;
using System.Linq;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    [InheritedExport]
    public class OutputLibrary
    {
        private IReadOnlyList<EnumProvider>? _enums;
        private IReadOnlyList<ModelProvider>? _models;
        // private IReadOnlyList<ClientProvider>? _clients;

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

        private IReadOnlyList<EnumProvider> Enums => _enums ??= BuildEnums();
        private IReadOnlyList<ModelProvider> Models => _models ??= BuildModels();

        // clientProvider should be added in SCM by overriding Providers property
        // public IReadOnlyList<ClientProvider> Clients => _clients ??= BuildClients();

        public virtual IEnumerable<TypeProvider> Providers
        {
            get
            {
                return Enums.Concat<TypeProvider>(Models);
            }
        }

        public IDictionary<InputEnumType, EnumProvider> EnumMappings { get; }
        public IDictionary<InputModelType, ModelProvider> ModelMappings { get; }

        private EnumProvider[] BuildEnums()
        {
            return _allModels.Value.Enums;
        }

        private ModelProvider[] BuildModels()
        {
            return _allModels.Value.Models;
        }
    }
}
