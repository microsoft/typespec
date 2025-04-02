// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;

namespace Microsoft.TypeSpec.Generator
{
    internal class GeneratorHandler
    {
        private const string NodeModulesDir = "node_modules";

        public void LoadGenerator(CommandLineOptions options)
        {
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using AggregateCatalog catalog = new(directoryCatalog);

            AddPluginDlls(catalog);

            using CompositionContainer container = new(catalog);

            container.ComposeExportedValue(new GeneratorContext(Configuration.Load(options.OutputDirectory)));
            container.ComposeParts(this);

            SelectGenerator(options);
        }

        private static void AddPluginDlls(AggregateCatalog catalog)
        {
            var dllPathsInOrder = GetOrderedPluginDlls(AppContext.BaseDirectory);
            if (dllPathsInOrder.Count == 0)
            {
                return;
            }

            var highestVersions = new Dictionary<string, (Version Version, string Path)>(StringComparer.OrdinalIgnoreCase);
            foreach (var dllPath in dllPathsInOrder)
            {
                try
                {
                    var asmName = AssemblyName.GetAssemblyName(dllPath);
                    var fullName = asmName.FullName;
                    var version = asmName.Version!;

                    if (!highestVersions.TryGetValue(fullName, out var existing) || version > existing.Version)
                    {
                        highestVersions[fullName] = (version, dllPath);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Could not read assembly info from {dllPath}: {ex.Message}");
                }
            }

            // Setup assembly resolver for transitive dependencies
            AppDomain.CurrentDomain.AssemblyResolve += (sender, args) =>
            {
                if (highestVersions.TryGetValue(args.Name, out var entry))
                {
                    return Assembly.LoadFrom(entry.Path);
                }
                return null;
            };

            // Load each highest-version DLL into the catalog
            foreach (KeyValuePair<string, (Version Version, string Path)> kvp in highestVersions)
            {
                try
                {
                    catalog.Catalogs.Add(new AssemblyCatalog(kvp.Value.Path));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Failed to load catalog for {kvp.Value.Path}: {ex.Message}");
                }
            }
        }

        internal static IList<string> GetOrderedPluginDlls(string pluginDirectoryStart)
        {
            var dllPathsInOrder = new List<string>();
            string? rootDirectory = FindRootDirectory(pluginDirectoryStart);
            if (rootDirectory == null)
            {
                return dllPathsInOrder;
            }

            var packagePath = Path.Combine(rootDirectory, "package.json");
            if (!File.Exists(packagePath))
            {
                return dllPathsInOrder;
            }

            using var doc = JsonDocument.Parse(File.ReadAllText(packagePath));
            if (!doc.RootElement.TryGetProperty("dependencies", out var deps))
            {
                return dllPathsInOrder;
            }

            var packageNamesInOrder = deps.EnumerateObject().Select(p => p.Name).ToList();

            foreach (var package in packageNamesInOrder)
            {
                var packageDistPath = Path.Combine(rootDirectory, NodeModulesDir, package, "dist");
                if (Directory.Exists(packageDistPath))
                {
                    var dlls = Directory.EnumerateFiles(packageDistPath, "*.dll", SearchOption.AllDirectories);
                    dllPathsInOrder.AddRange(dlls);
                }
            }

            return dllPathsInOrder;
        }

        private static string? FindRootDirectory(string startDirectory)
        {
            var dir = new DirectoryInfo(startDirectory);
            while (dir != null)
            {
                if (dir.Name == NodeModulesDir)
                {
                    return dir.Parent?.FullName;
                }

                dir = dir.Parent;
            }
            return null;
        }

        internal void SelectGenerator(CommandLineOptions options)
        {
            bool loaded = false;
            foreach (var generator in Generators!)
            {
                if (generator.Metadata.GeneratorName == options.GeneratorName!)
                {
                    CodeModelGenerator.Instance = generator.Value;
                    CodeModelGenerator.Instance.IsNewProject = options.IsNewProject;

                    // Apply discovered plugins (if any)
                    if (Plugins != null)
                    {
                        foreach (var plugin in Plugins)
                        {
                            plugin.Apply(CodeModelGenerator.Instance);
                        }
                    }

                    CodeModelGenerator.Instance.Configure();
                    loaded = true;
                    break;
                }
            }

            if (!loaded)
            {
                throw new InvalidOperationException($"Generator {options.GeneratorName} not found.");
            }
        }

        [ImportMany]
        public IEnumerable<Lazy<CodeModelGenerator, IMetadata>>? Generators { get; set; }

        [ImportMany]
        public IEnumerable<GeneratorPlugin>? Plugins { get; set; }
    }

    public interface IMetadata
    {
        string GeneratorName { get; }
    }
}
