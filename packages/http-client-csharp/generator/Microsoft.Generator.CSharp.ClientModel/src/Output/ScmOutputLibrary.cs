// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.ClientModel.Output
{
    internal class ScmOutputLibrary : OutputLibrary
    {
        public ScmOutputLibrary(InputNamespace input) : base(input)
        {
        }

        protected override ModelTypeProvider[] BuildModels()
        {
            List<ModelTypeProvider> modelProviders = new List<ModelTypeProvider>();

            foreach (var model in Input.Models)
            {
                modelProviders.Add(new ModelTypeProvider(model, null));
            }

            return modelProviders.ToArray();
        }
    }
}
