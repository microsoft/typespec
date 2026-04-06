// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;

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

            // Load plugins specified via the 'plugins' configuration option
            var configuration = Configuration.Load(options.OutputDirectory);
            AddConfiguredPluginDlls(catalog, configuration);

            using CompositionContainer container = new(catalog);

            container.ComposeExportedValue(new GeneratorContext(configuration));
            container.ComposeParts(this);

            SelectGenerator(options);
        }

        private static void AddPluginDlls(AggregateCatalog catalog)
        {
            string? rootDirectory = FindRootDirectory(AppContext.BaseDirectory);
            if (rootDirectory == null)
            {
                return;
            }

            var packagePath = Path.Combine(rootDirectory, "package.json");
            if (!File.Exists(packagePath))
            {
                return;
            }

            using var doc = JsonDocument.Parse(File.ReadAllText(packagePath));
            if (!doc.RootElement.TryGetProperty("dependencies", out var deps))
            {
                return;
            }

            // We need to construct the emitter independently as the CodeModelGenerator is not yet initialized.
            using var emitter = new Emitter(Console.OpenStandardOutput());

            var packageNamesInOrder = deps.EnumerateObject().Select(p => p.Name).ToList();
            var dllPathsInOrder = new List<string>();

            foreach (var package in packageNamesInOrder)
            {
                var packageDir = Path.Combine(rootDirectory, NodeModulesDir, package);
                var packageDistPath = Path.Combine(packageDir, "dist");

                if (Directory.Exists(packageDistPath))
                {
                    var dlls = Directory.EnumerateFiles(packageDistPath, "*.dll", SearchOption.AllDirectories);
                    dllPathsInOrder.AddRange(dlls);
                }
                else
                {
                    // No pre-built DLLs — look for a .csproj to build
                    var builtDll = BuildPluginIfNeeded(packageDir, emitter);
                    if (builtDll != null)
                    {
                        dllPathsInOrder.Add(builtDll);
                    }
                }
            }

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
                    emitter.Info($"Warning: Could not read assembly info from {dllPath}: {ex.Message}");
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
                    emitter.Info($"Warning: Failed to load catalog for {kvp.Value.Path}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Loads plugin assemblies from directory paths specified via the 'plugins' configuration option.
        /// If a directory contains a .csproj file, the project is built first to produce the plugin assembly.
        /// </summary>
        internal static void AddConfiguredPluginDlls(AggregateCatalog catalog, Configuration configuration)
        {
            var pluginPaths = configuration.PluginPaths;
            if (pluginPaths == null || pluginPaths.Count == 0)
            {
                return;
            }

            using var emitter = new Emitter(Console.OpenStandardOutput());

            foreach (var pluginPath in pluginPaths)
            {
                if (string.IsNullOrEmpty(pluginPath))
                {
                    continue;
                }

                if (!Directory.Exists(pluginPath))
                {
                    throw new InvalidOperationException(
                        $"Plugin path '{pluginPath}' is not a valid directory.");
                }

                var builtDll = BuildPluginIfNeeded(pluginPath, emitter);
                if (builtDll != null)
                {
                    catalog.Catalogs.Add(new AssemblyCatalog(builtDll));
                }
                else
                {
                    // No .csproj found — scan for pre-built DLLs
                    foreach (var dll in Directory.EnumerateFiles(pluginPath, "*.dll"))
                    {
                        try
                        {
                            catalog.Catalogs.Add(new AssemblyCatalog(dll));
                        }
                        catch
                        {
                            // Skip DLLs that can't be loaded as MEF catalogs (e.g. native DLLs)
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Looks for a .csproj in the given directory (recursively) and builds it if found.
        /// Returns the path to the built DLL, or null if no .csproj was found.
        /// </summary>
        internal static string? BuildPluginIfNeeded(string directory, Emitter emitter)
        {
            var csprojFiles = Directory.GetFiles(directory, "*.csproj", SearchOption.AllDirectories);
            if (csprojFiles.Length == 0)
            {
                return null;
            }

            return BuildPlugin(csprojFiles[0], emitter);
        }

        /// <summary>
        /// Builds a plugin .csproj and returns the path to the output DLL.
        /// The output path is constructed from the csproj properties rather than parsing build output.
        /// </summary>
        internal static string? BuildPlugin(string csprojPath, Emitter emitter)
        {
            emitter.Info($"Building plugin: {csprojPath}");

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "dotnet",
                    Arguments = $"build \"{csprojPath}\" -c Release",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();
            // Read both streams to avoid deadlocks, even though we only use stderr for error reporting.
            process.StandardOutput.ReadToEnd();
            var stderr = process.StandardError.ReadToEnd();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"Failed to build plugin '{csprojPath}'. Exit code: {process.ExitCode}\n{stderr}");
            }

            var dllPath = GetExpectedOutputPath(csprojPath);
            if (dllPath != null && File.Exists(dllPath))
            {
                emitter.Info($"Plugin built: {dllPath}");
                return dllPath;
            }

            emitter.Info($"Warning: Build succeeded but could not determine output DLL path for '{csprojPath}'");
            return null;
        }

        /// <summary>
        /// Constructs the expected output DLL path from the csproj properties:
        /// [ProjectDirectory]/bin/Release/[TargetFramework]/[AssemblyName].dll
        /// </summary>
        internal static string? GetExpectedOutputPath(string csprojPath)
        {
            var projectDir = Path.GetDirectoryName(csprojPath)!;
            var projectName = Path.GetFileNameWithoutExtension(csprojPath);

            try
            {
                using var stream = File.OpenRead(csprojPath);
                var doc = XDocument.Load(stream);

                var propertyGroups = doc.Descendants("PropertyGroup");
                string? targetFramework = null;
                string? assemblyName = null;

                foreach (var pg in propertyGroups)
                {
                    targetFramework ??= pg.Element("TargetFramework")?.Value;
                    assemblyName ??= pg.Element("AssemblyName")?.Value;
                }

                // For multi-targeting projects, use the first target framework
                if (string.IsNullOrEmpty(targetFramework))
                {
                    foreach (var pg in propertyGroups)
                    {
                        var frameworks = pg.Element("TargetFrameworks")?.Value;
                        if (!string.IsNullOrEmpty(frameworks))
                        {
                            targetFramework = frameworks.Split(';', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
                            break;
                        }
                    }
                }

                if (string.IsNullOrEmpty(targetFramework))
                {
                    return null;
                }

                var effectiveAssemblyName = string.IsNullOrEmpty(assemblyName) ? projectName : assemblyName;
                return Path.Combine(projectDir, "bin", "Release", targetFramework, $"{effectiveAssemblyName}.dll");
            }
            catch
            {
                return null;
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
