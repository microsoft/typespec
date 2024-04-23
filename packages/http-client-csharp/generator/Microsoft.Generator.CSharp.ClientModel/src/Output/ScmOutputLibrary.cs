// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.ClientModel.Output
{
    internal class ScmOutputLibrary : OutputLibrary
    {
        public override IDictionary<InputEnumType, EnumType> EnumMappings { get; }
        public override IDictionary<InputModelType, ModelTypeProvider> ModelMappings { get; }

        public ScmOutputLibrary()
        {
            EnumMappings = new Dictionary<InputEnumType, EnumType>();
            ModelMappings = new Dictionary<InputModelType, ModelTypeProvider>();
        }

        protected override ModelTypeProvider[] BuildModels()
        {
            var input = ClientModelPlugin.Instance.InputLibrary.InputNamespace;

            var modelsCount = input.Models.Count;
            ModelTypeProvider[] modelProviders = new ModelTypeProvider[modelsCount];

            for (int i = 0; i < modelsCount; i++)
            {
                var model = input.Models[i];
                var typeProvider = new ModelTypeProvider(model, null);

                modelProviders[i]  = typeProvider;
                ModelMappings.Add(model, typeProvider);
            }

            return modelProviders;
        }
    }
}
