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

        private IReadOnlyList<TypeProvider>? _types;
        public IReadOnlyList<TypeProvider> Types => _types ??= BuildTypes();

        private static TypeProvider[] BuildEnums()
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
            return enums;
        }

        private TypeProvider[] BuildModels()
        {
            var input = CodeModelPlugin.Instance.InputLibrary.InputNamespace;
            var models = new TypeProvider[input.Models.Count];
            for (int i = 0; i < models.Length; i++)
            {
                var inputModel = input.Models[i];
                var cSharpModel = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputModel);
                TypeProvider modelType = cSharpModel.Implementation;
                models[i] = modelType;
            }
            return models;
        }

        protected virtual TypeProvider[] BuildTypes()
        {
            return
            [
                ..BuildEnums(),
                ..BuildModels(),
                new ChangeTrackingListProvider(),
                new ChangeTrackingDictionaryProvider(),
                new ArgumentProvider(),
                new OptionalProvider(),
            ];
        }
    }
}
