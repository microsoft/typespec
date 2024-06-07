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

        private IReadOnlyList<TypeProvider>? _outputTypes;
        public IReadOnlyList<TypeProvider> OutputTypes => _outputTypes ??= BuildOutputTypes();

        protected virtual IReadOnlyList<TypeProvider> BuildOutputTypes()
        {
            var inputNamespace = CodeModelPlugin.Instance.InputLibrary.InputNamespace;
            var inputEnums = inputNamespace.Enums;
            var inputModels = inputNamespace.Models;
            var inputClients = inputNamespace.Clients;

            var outputTypes = new List<TypeProvider>(inputEnums.Count + inputModels.Count + inputClients.Count);

            foreach (var inputEnum in inputEnums)
            {
                var enumType = CodeModelPlugin.Instance.TypeFactory.CreateEnumType(inputEnum);
                outputTypes.Add(enumType);
                if (enumType.Serialization is not null)
                {
                    outputTypes.Add(enumType.Serialization);
                }
            }

            foreach (var inputModel in inputModels)
            {
                var modelType = CodeModelPlugin.Instance.TypeFactory.CreateModelType(inputModel);
                outputTypes.Add(modelType);
                outputTypes.AddRange(modelType.SerializationProviders);
            }

            foreach (var inputClient in inputClients)
            {
                var clientType = CodeModelPlugin.Instance.TypeFactory.CreateClientType(inputClient);
                outputTypes.Add(clientType);
            }

            return outputTypes;
        }
    }
}
