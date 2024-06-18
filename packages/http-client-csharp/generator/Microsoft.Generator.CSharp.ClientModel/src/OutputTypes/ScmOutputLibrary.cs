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
            List<TypeProvider> types = new List<TypeProvider>();
            types.AddRange(base.BuildTypes());
            types.Add(ModelSerializationExtensionsProvider.Instance);
            types.Add(TypeFormattersProvider.Instance);
            return types;
        }
    }
}
