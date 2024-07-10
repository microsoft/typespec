// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public class OutputLibrary
    {
        public OutputLibrary()
        {
        }

        private IReadOnlyList<TypeProvider>? _typeProviders;
        public IReadOnlyList<TypeProvider> TypeProviders
        {
            get
            {
                return _typeProviders ??= BuildTypeProviders();
            }
            internal set
            {
                _typeProviders = value;
            }
        }

        private static TypeProvider[] BuildEnums()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;
            var enums = new TypeProvider[input.Enums.Count];
            for (int i = 0; i < enums.Length; i++)
            {
                var inputEnum = input.Enums[i];
                enums[i] = CodeModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
            }
            return enums;
        }

        private static TypeProvider[] BuildModels()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;
            var models = new TypeProvider[input.Models.Count];
            for (int i = 0; i < models.Length; i++)
            {
                var inputModel = input.Models[i];
                models[i] = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            }
            return models;
        }

        protected virtual TypeProvider[] BuildTypeProviders()
        {
            return
            [
                ..BuildEnums(),
                ..BuildModels(),
                new ChangeTrackingListDefinition(),
                new ChangeTrackingDictionaryDefinition(),
                new ArgumentDefinition(),
                new OptionalDefinition(),
            ];
        }

        protected internal virtual OutputLibraryVisitor[]? GetOutputLibraryVisitors() => null;
    }
}
