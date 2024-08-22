// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;

namespace Microsoft.Generator.CSharp
{
    internal class PluginHandler
    {
        public void LoadPlugin(CommandLineOptions options)
        {
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using CompositionContainer container = new(directoryCatalog);

            container.ComposeExportedValue(new GeneratorContext(Configuration.Load(options.OutputDirectory)));
            container.ComposeParts(this);

            SelectPlugin(options);
        }

        internal void SelectPlugin(CommandLineOptions options)
        {
            bool loaded = false;
            foreach (var plugin in Plugins!)
            {
                if (plugin.Metadata.PluginName == options.PluginName!)
                {
                    CodeModelPlugin.Instance = plugin.Value;
                    CodeModelPlugin.Instance.IsNewProject = options.IsNewProject;
                    loaded = true;
                    CodeModelPlugin.Instance.Configure();
                    break;
                }
            }

            if (!loaded)
            {
                throw new InvalidOperationException($"Plugin {options.PluginName} not found.");
            }
        }

        [ImportMany]
        public IEnumerable<Lazy<CodeModelPlugin, IMetadata>>? Plugins { get; set; }
    }

    public interface IMetadata
    {
        string PluginName { get; }
    }
}
