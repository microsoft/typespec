// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmOutputLibrary : OutputLibrary
    {
        protected override IReadOnlyList<TypeProvider> BuildTypes()
        {
            var types = base.BuildTypes();
            var newTypes = new List<TypeProvider>(types.Count);
            foreach (var type in types)
            {
                if (type is EnumProvider enumType && enumType.Serialization != null)
                {
                    newTypes.Add(enumType.Serialization);
                    continue;
                }

                if (type is ModelProvider modelType)
                {
                    newTypes.AddRange(modelType.SerializationProviders);
                    continue;
                }
            }
            return [.. base.BuildTypes(), .. newTypes, ModelSerializationExtensionsProvider.Instance, TypeFormattersProvider.Instance];
        }
    }
}
