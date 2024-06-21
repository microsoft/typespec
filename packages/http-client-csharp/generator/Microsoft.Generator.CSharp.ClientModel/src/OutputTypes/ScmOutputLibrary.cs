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
            var baseTypes = base.BuildTypes();
            var updatedTypes = new TypeProvider[baseTypes.Count];

            var systemOptionalProvider = new SystemOptionalProvider();
            for (var i = 0; i < baseTypes.Count; i++)
            {
                updatedTypes[i] = baseTypes[i] is OptionalProvider ? systemOptionalProvider : baseTypes[i];
            }

            return [.. updatedTypes, ModelSerializationExtensionsProvider.Instance, TypeFormattersProvider.Instance];
        }
    }
}
