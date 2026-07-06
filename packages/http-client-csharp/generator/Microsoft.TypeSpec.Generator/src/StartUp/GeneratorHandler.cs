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
using Microsoft.TypeSpec.Generator.Utilities;

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

            return BuildPlugin(csprojFiles[0], directory, emitter);
        }

        /// <summary>
        /// Builds a plugin .csproj and returns the path to the output DLL by scanning
        /// <paramref name="scanDirectory"/> for the built assembly.
        /// </summary>
        internal static string? BuildPlugin(string csprojPath, string scanDirectory, Emitter emitter)
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
            // Read both streams to avoid deadlocks. 'dotnet build' writes build/compiler
            // errors to standard output rather than standard error, so we include both when
            // reporting a failure.
            var stdout = process.StandardOutput.ReadToEnd();
            var stderr = process.StandardError.ReadToEnd();
            process.WaitForExit();

            if (process.ExitCode != 0)
            {
                // The build may fail when the same plugin is being built in parallel for
                // multiple referenced projects within a single solution folder. If a previously
                // built assembly already exists, reuse it instead of aborting generation.
                var existingDll = FindPluginAssembly(csprojPath, scanDirectory);
                if (existingDll != null)
                {
                    emitter.Info(
                        $"Plugin build for '{csprojPath}' failed with exit code {process.ExitCode}; using existing artifact (not re-built): {existingDll}");
                    return existingDll;
                }

                // Log an error instead of throwing so that a failed plugin build does not abort
                // the entire generation.
                emitter.ReportDiagnostic(
                    DiagnosticCodes.PluginBuildFailed,
                    $"Failed to build plugin '{csprojPath}'. Exit code: {process.ExitCode}\n{stdout}\n{stderr}",
                    severity: EmitterDiagnosticSeverity.Error);
                return null;
            }

            var dllPath = FindPluginAssembly(csprojPath, scanDirectory);
            if (dllPath != null)
            {
                emitter.Info($"Plugin built: {dllPath}");
                return dllPath;
            }

            emitter.Info($"Warning: Build succeeded but could not locate the output DLL for '{csprojPath}'");
            return null;
        }

        /// <summary>
        /// Locates the assembly produced by building a plugin .csproj by scanning
        /// <paramref name="scanDirectory"/> for a DLL whose name matches the project's
        /// assembly name. Scanning is used instead of computing the output path because
        /// the build output location varies across repositories (for example, some
        /// redirect output to an 'artifacts' folder) and target frameworks, which makes
        /// a computed path unreliable.
        /// </summary>
        internal static string? FindPluginAssembly(string csprojPath, string scanDirectory)
        {
            var dllName = GetAssemblyName(csprojPath) + ".dll";

            return Directory.EnumerateFiles(scanDirectory, dllName, SearchOption.AllDirectories)
                // Skip intermediate build output under 'obj' (e.g. obj/.../ref/*.dll
                // reference assemblies), which are metadata-only and cannot be loaded.
                .FirstOrDefault(path => !ContainsDirectorySegment(path, "obj"));
        }

        /// <summary>
        /// Reads the &lt;AssemblyName&gt; from the csproj, falling back to the project file name
        /// when it is not explicitly specified.
        /// </summary>
        internal static string GetAssemblyName(string csprojPath)
        {
            try
            {
                using var stream = File.OpenRead(csprojPath);
                var doc = XDocument.Load(stream);

                var assemblyName = doc.Descendants("PropertyGroup")
                    .Select(pg => pg.Element("AssemblyName")?.Value)
                    .FirstOrDefault(value => !string.IsNullOrEmpty(value));

                if (!string.IsNullOrEmpty(assemblyName))
                {
                    return assemblyName!;
                }
            }
            catch
            {
                // Fall back to the project file name below.
            }

            return Path.GetFileNameWithoutExtension(csprojPath);
        }

        private static bool ContainsDirectorySegment(string path, string segment)
        {
            var dir = Path.GetDirectoryName(path);
            while (!string.IsNullOrEmpty(dir))
            {
                if (string.Equals(Path.GetFileName(dir), segment, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                dir = Path.GetDirectoryName(dir);
            }
            return false;
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
