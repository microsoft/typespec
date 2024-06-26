// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmOutputLibrary : OutputLibrary
    {
        protected override TypeProvider[] BuildTypes()
        {
            var baseTypes = base.BuildTypes();
            var systemOptionalProvider = new SystemOptionalProvider();

            for (var i = 0; i < baseTypes.Length; i++)
            {
                if (baseTypes[i] is OptionalProvider)
                {
                    baseTypes[i] = systemOptionalProvider;
                }
            }

            return [.. baseTypes, new ModelSerializationExtensionsProvider(), new TypeFormattersProvider()];
        }
    }
}
