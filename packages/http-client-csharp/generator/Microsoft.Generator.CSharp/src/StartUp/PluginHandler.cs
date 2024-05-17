// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;

namespace Microsoft.Generator.CSharp
{
    internal class PluginHandler
    {
        public void LoadPlugin(string outputDirectory)
        {
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using (CompositionContainer container = new(directoryCatalog))
            {
                container.ComposeExportedValue(new GeneratorContext(Configuration.Load(outputDirectory)));
                var plugin = container.GetExportedValue<CodeModelPlugin>();
                if (plugin == null)
                {
                    throw new InvalidOperationException($"Cannot find exported value in current directory {AppContext.BaseDirectory}.");
                }
            }
        }
    }
}
