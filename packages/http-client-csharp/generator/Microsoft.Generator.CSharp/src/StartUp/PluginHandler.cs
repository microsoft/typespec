// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.IO;

namespace Microsoft.Generator.CSharp
{
    internal class PluginHandler
    {
        private readonly string _defaultClientModelPluginId = "@typespec" + Path.DirectorySeparatorChar + "http-client-csharp-generator-clientModel";
        private readonly string _pluginName;

        /// <summary>
        /// Constructs a new instance of <see cref="PluginHandler"/> with the specified plugin name and version.
        /// The plugin is then loaded using the <see cref="LoadPlugin"/> method.
        /// </summary>
        /// <param name="name">The name of the plugin to load.</param>
        public PluginHandler(string? name)
        {
            _pluginName = name ?? _defaultClientModelPluginId;
        }

        private string? _nodeModulesFolder;
        private string NodeModulesFolder => _nodeModulesFolder ??= GetDirectoryCatalog();

        private string GetDirectoryCatalog()
        {
            return FindNodeModules(new DirectoryInfo(AppContext.BaseDirectory));
        }

        public void LoadPlugin(string outputDirectory)
        {
            using DirectoryCatalog directoryCatalog = new(Path.Combine(NodeModulesFolder, _pluginName));
            using (CompositionContainer container = new(directoryCatalog))
            {
                try
                {
                    container.ComposeExportedValue(new GeneratorContext(Configuration.Load(outputDirectory)));
                    var plugin = container.GetExportedValue<CodeModelPlugin>();
                    if (plugin == null)
                    {
                        throw new InvalidOperationException($"Cannot find exported value in composition container for {_pluginName}.");
                    }
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException($"Failed to load client model plugin {_pluginName}.", ex);
                }
            }
        }

        private string FindNodeModules(DirectoryInfo? path)
        {
            if (path is null)
            {
                throw new InvalidOperationException($"Unable to find node_modules in path {AppContext.BaseDirectory}");
            }

            if (path.Name == "node_modules")
            {
                return path.FullName;
            }

            foreach (var child in path.GetDirectories())
            {
                if (child.Name == "node_modules")
                {
                    return child.FullName;
                }
            }

            return FindNodeModules(path.Parent);
        }
    }
}
