// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    public class OutputLibrary
    {
        private IReadOnlyList<TypeProvider>? _typeProviders;
        public IReadOnlyList<TypeProvider> TypeProviders
        {
            get => _typeProviders ??= BuildTypeProviders();
            internal set => _typeProviders = value;
        }

        private static TypeProvider[] BuildEnums()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;
            var enums = new List<TypeProvider>(input.Enums.Count);
            foreach (var inputEnum in input.Enums)
            {
                if (inputEnum.Usage.HasFlag(Input.InputModelTypeUsage.ApiVersionEnum))
                    continue;
                var outputEnum = CodeModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
                if (outputEnum != null)
                {
                    enums.Add(outputEnum);
                }
            }

            return [.. enums];
        }

        private static TypeProvider[] BuildModels()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;
            var models = new List<TypeProvider>(input.Models.Count);
            foreach (var inputModel in input.Models)
            {
                var outputModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
                if (outputModel != null)
                {
                    models.Add(outputModel);
                }
            }

            return [.. models];
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
    }
}
