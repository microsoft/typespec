// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public class OutputLibrary
    {
        private List<OutputLibraryVisitor> _visitors = new();
        public OutputLibrary()
        {
        }

        private IReadOnlyList<TypeProvider>? _typeProviders;
        public IReadOnlyList<TypeProvider> TypeProviders
        {
            get => _typeProviders ??= BuildTypeProviders();
            internal set => _typeProviders = value;
        }

        private static TypeProvider[] BuildEnums()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;
            var count = input.Enums.Count;
            List<TypeProvider> enums = new(count);
            for (int i = 0; i < count; i++)
            {
                var inputEnum = input.Enums[i];
                if (inputEnum.Usage.HasFlag(Input.InputModelTypeUsage.ApiVersionEnum))
                    continue;
                enums.Add(CodeModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum));
            }
            return [.. enums];
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

        // TODO - make this more additive instead of replace https://github.com/microsoft/typespec/issues/3827
        protected internal virtual IEnumerable<OutputLibraryVisitor> GetOutputLibraryVisitors() => _visitors;

        public void AddVisitor(OutputLibraryVisitor visitor)
        {
            _visitors.Add(visitor);
        }
    }
}
