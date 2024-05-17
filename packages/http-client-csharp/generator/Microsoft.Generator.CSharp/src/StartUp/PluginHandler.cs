// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;

namespace Microsoft.Generator.CSharp
{
    internal class PluginHandler
    {
        internal static CodeModelPlugin? Plugin { get; set; }
        public void LoadPlugin(string outputDirectory, CodeModelPlugin? plugin = default)
        {
            if (plugin != null)
            {
                Plugin = plugin;
                return;
            }
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using (CompositionContainer container = new(directoryCatalog))
            {
                try
                {
                    container.ComposeExportedValue(new GeneratorContext(Configuration.Load(outputDirectory)));
                    Plugin = container.GetExportedValue<CodeModelPlugin>();
                    if (Plugin == null)
                    {
                        throw new InvalidOperationException($"Cannot find exported value in current directory {AppContext.BaseDirectory}.");
                    }
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Failed to load plugin from {AppContext.BaseDirectory}.", ex);
                }
            }
        }
    }
}
