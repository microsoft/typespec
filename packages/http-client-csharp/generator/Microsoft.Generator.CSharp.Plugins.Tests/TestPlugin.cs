// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Plugin.Tests
{
    public class TestPlugin : CodeModelPlugin
    {
        internal TestPlugin(Configuration configuration) : base(configuration)
        {
        }

        public override TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);

        /// <summary>
        /// Returns the serialization type providers for the given model type provider.
        /// </summary>
        /// <param name="provider">The model type provider.</param>
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(ModelProvider provider)
        {
            // Add MRW serialization type provider
            //return [new MrwSerializationTypeProvider(provider)];
            return Array.Empty<TypeProvider>();
        }
    }
}
